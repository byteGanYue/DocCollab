import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DocumentArchiveDocument = DocumentArchive & Document;

@Schema({ timestamps: true })
export class DocumentArchive {
    @Prop({ required: true, type: Types.ObjectId, ref: 'Document' })
    documentId: Types.ObjectId;

    @Prop({ required: true })
    archiveId: string; // 归档ID，格式：archive_${timestamp}_${random}

    @Prop({ required: true })
    archiveType: 'daily' | 'manual' | 'milestone' | 'compliance'; // 归档类型

    @Prop({ required: true })
    archiveName: string; // 归档名称，如"每日归档-2024-01-15"

    @Prop({ required: true })
    archiveDescription: string; // 归档描述

    @Prop({ required: true, type: Buffer })
    yjsState: Buffer; // 全量 yjsState（二进制）

    @Prop({ required: true, type: Object })
    structuredContent: any; // 结构化内容（JSON）

    @Prop({ required: true })
    contentHash: string; // 内容哈希，用于快速比较

    @Prop({ required: true })
    contentSize: number; // 内容大小（字节）

    @Prop({ required: true })
    documentVersion: number; // 文档版本号

    @Prop({ required: true })
    createdBy: string; // 创建人

    @Prop({ required: true })
    createdByUserId: number; // 创建人ID

    @Prop({ required: true })
    createdAt: Date; // 创建时间

    @Prop({ type: [String] })
    tags: string[]; // 标签，如["重要", "合规", "里程碑"]

    @Prop({ type: Object })
    metadata: {
        // 元数据
        userCount: number; // 当时在线用户数
        sessionDuration: number; // 会话时长
        changeCount: number; // 变更次数
        collaborators: string[]; // 协作者列表
        systemInfo: {
            // 系统信息
            version: string;
            platform: string;
            userAgent: string;
        };
    };

    @Prop({ type: Object })
    auditInfo: {
        // 审计信息
        ipAddress: string;
        userAgent: string;
        sessionId: string;
        operationType: string; // 操作类型
        reason: string; // 归档原因
        complianceLevel: string; // 合规级别
    };

    @Prop({ default: false })
    isProtected: boolean; // 是否受保护（防止删除）

    @Prop({ default: false })
    isCompliance: boolean; // 是否合规归档

    @Prop({ type: Date })
    retentionUntil: Date; // 保留期限

    @Prop({ type: Object })
    backupInfo: {
        // 备份信息
        backupLocation: string; // 备份位置
        backupSize: number; // 备份大小
        backupChecksum: string; // 备份校验和
        lastBackupAt: Date; // 最后备份时间
    };
}

export const DocumentArchiveSchema = SchemaFactory.createForClass(DocumentArchive);

// 索引优化
DocumentArchiveSchema.index({ documentId: 1, createdAt: -1 });
DocumentArchiveSchema.index({ archiveType: 1, createdAt: -1 });
DocumentArchiveSchema.index({ createdByUserId: 1, createdAt: -1 });
DocumentArchiveSchema.index({ contentHash: 1 });
DocumentArchiveSchema.index({ isCompliance: 1 });
DocumentArchiveSchema.index({ retentionUntil: 1 }); 