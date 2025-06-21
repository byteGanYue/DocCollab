import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { RecentVisitsService } from './recent-visits.service';
import { CreateRecentVisitDto } from './dto/create-recent-visit.dto';
import { UpdateRecentVisitDto } from './dto/update-recent-visit.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('最近访问记录管理')
@Controller('recent-visits')
export class RecentVisitsController {
  constructor(private readonly recentVisitsService: RecentVisitsService) {}

  @Post()
  @ApiOperation({ summary: '创建最近访问记录' })
  @ApiResponse({ status: 201, description: '访问记录创建成功' })
  create(@Body() createRecentVisitDto: CreateRecentVisitDto) {
    return this.recentVisitsService.create(createRecentVisitDto);
  }

  @Get()
  @ApiOperation({ summary: '获取所有最近访问记录' })
  @ApiResponse({ status: 200, description: '返回所有访问记录列表' })
  findAll() {
    return this.recentVisitsService.findAll();
  }

  @Get('getRecentVisitsByUserId/:userId')
  @ApiOperation({ summary: '根据用户ID获取最近访问记录（通过visitId匹配）' })
  @ApiResponse({
    status: 200,
    description: '返回用户的最近访问记录列表（分页）',
  })
  @ApiParam({
    name: 'userId',
    description: '用户ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiQuery({
    name: 'page',
    description: '页码（从1开始）',
    example: 1,
    required: false,
  })
  @ApiQuery({
    name: 'pageSize',
    description: '每页记录数',
    example: 10,
    required: false,
  })
  findByUserId(
    @Param('userId') userId: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.recentVisitsService.findByUserId(userId, page, pageSize);
  }

  @Get('getRecentVisitsById/:id')
  @ApiOperation({ summary: '获取指定访问记录' })
  @ApiResponse({ status: 200, description: '返回指定访问记录信息' })
  @ApiParam({
    name: 'id',
    description: '访问记录ID',
    example: '507f1f77bcf86cd799439011',
  })
  findOne(@Param('id') id: string) {
    return this.recentVisitsService.findOne(id);
  }

  @Patch('updateRecentVisits/:id')
  @ApiOperation({ summary: '更新访问记录信息' })
  @ApiResponse({ status: 200, description: '访问记录信息更新成功' })
  @ApiParam({
    name: 'id',
    description: '访问记录ID',
    example: '507f1f77bcf86cd799439011',
  })
  update(
    @Param('id') id: string,
    @Body() updateRecentVisitDto: UpdateRecentVisitDto,
  ) {
    return this.recentVisitsService.update(id, updateRecentVisitDto);
  }

  @Delete('deleteRecentVisits/:id')
  @ApiOperation({ summary: '删除访问记录' })
  @ApiResponse({ status: 200, description: '访问记录删除成功' })
  @ApiParam({
    name: 'id',
    description: '访问记录ID',
    example: '507f1f77bcf86cd799439011',
  })
  remove(@Param('id') id: string) {
    return this.recentVisitsService.remove(id);
  }

  @Delete('deleteAllRecentVisits/:userId/clear')
  @ApiOperation({ summary: '清空用户的所有访问记录' })
  @ApiResponse({ status: 200, description: '用户访问记录清空成功' })
  @ApiParam({
    name: 'userId',
    description: '用户ID',
    example: '507f1f77bcf86cd799439011',
  })
  clearUserVisits(@Param('userId') userId: string) {
    return this.recentVisitsService.clearUserVisits(userId);
  }
}
