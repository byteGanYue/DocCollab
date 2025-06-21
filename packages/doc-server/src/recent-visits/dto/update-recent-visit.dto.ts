import { PartialType } from '@nestjs/swagger';
import { CreateRecentVisitDto } from './create-recent-visit.dto';

/**
 * 更新最近访问记录的数据传输对象
 * 继承自CreateRecentVisitDto，所有字段都变为可选
 */
export class UpdateRecentVisitDto extends PartialType(CreateRecentVisitDto) {}
