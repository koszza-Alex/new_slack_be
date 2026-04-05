import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { File } from './entities/file.entity';
import { User } from '../user/entities/user.entity';
import { Workspace } from '../workspace/entities/workspace.entity';
import { Channel } from '../channel/entities/channel.entity';
import { Message } from '../message/entities/message.entity';
import { FileGateway } from './file.gateway';
import { UploadFileDto } from './dto/upload-file.dto';

@Injectable()
export class FileService {
  constructor(
    @InjectRepository(File) private fileRepo: Repository<File>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Workspace)
    private workspaceRepo: Repository<Workspace>,
    @InjectRepository(Channel)
    private channelRepo: Repository<Channel>,
    @InjectRepository(Message)
    private messageRepo: Repository<Message>,
    private fileGateway: FileGateway,
  ) { }

  async uploadFiles(
    userEmail: string,
    dto: UploadFileDto,
    files: Express.Multer.File[],
  ): Promise<File[]> {
    // ✅ Check dto is defined
    if (!dto) {
      throw new BadRequestException('Upload data missing');
    }

    const sender = await this.userRepo.findOne({ where: { email: userEmail } });
    if (!sender) throw new NotFoundException('User not found');

    const { workspaceId, channelId, messageId } = dto;

    const workspace = await this.workspaceRepo.findOne({
      where: { id: workspaceId },
      relations: ['creator'],
    });
    if (!workspace) throw new NotFoundException('Workspace not found');

    let channel: Channel | null = null;
    if (channelId) {
      channel = await this.channelRepo.findOne({
        where: { id: channelId, workspace: { id: workspaceId } },
      });
      if (!channel) throw new NotFoundException('Channel not found');
    }

    let message: Message | null = null;
    if (messageId) {
      message = await this.messageRepo.findOne({ where: { id: messageId } });
      if (!message) throw new NotFoundException('Message not found');
    }

    const fileEntities = files.map((file) =>
      this.fileRepo.create({
        filename: file.filename,
        originalname: file.originalname,
        path: file.path,
        size: file.size,
        sender,
        workspace,
        ...(channel && { channel }),
        ...(message && { message }),
      }),
    );

    const savedFiles = await this.fileRepo.save(fileEntities);

    this.fileGateway.emitFilesUploaded(workspace.id, savedFiles);

    return savedFiles;
  }

  async deleteFile(userEmail: string, fileId: string) {
    const file = await this.fileRepo.findOne({
      where: { id: fileId },
      relations: ['sender', 'workspace', 'workspace.creator'],
    });

    if (!file) throw new NotFoundException('File not found');
    const user = await this.userRepo.findOne({ where: { email: userEmail } });
    if (!user) throw new NotFoundException('User not found');
    const isOwner = file.sender.id === user.id;
    const isWorkspaceOwner = file.workspace.creator.id === user.id;

    if (!isOwner && !isWorkspaceOwner) {
      throw new ForbiddenException('Not allowed');
    }

    await this.fileRepo.remove(file);

    this.fileGateway.emitFileDeleted(file.workspace.id, fileId);

    return { message: 'File deleted' };
  }

  async getFiles(workspaceId: string, channelId?: string) {
    const query = this.fileRepo
      .createQueryBuilder('file')
      .leftJoinAndSelect('file.sender', 'sender')
      .leftJoinAndSelect('file.channel', 'channel')
      .where('file.workspaceId = :workspaceId', { workspaceId });

    if (channelId) {
      query.andWhere('file.channelId = :channelId', { channelId });
    }

    return query.orderBy('file.createdAt', 'DESC').getMany();
  }
}