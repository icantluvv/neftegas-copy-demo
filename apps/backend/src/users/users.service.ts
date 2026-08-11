import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import { CreateUserDto } from './dto/create-user.dto';
import { FindUsersQueryDto } from './dto/find-users-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private users: Repository<User>) {}

  findAll(query: FindUsersQueryDto) {
    const qb = this.users.createQueryBuilder('user');
    if (query.role) qb.andWhere('user.role = :role', { role: query.role });
    if (query.filialId) qb.andWhere('user.filialId = :filialId', { filialId: query.filialId });
    if (query.cfoId) qb.andWhere('user.cfoId = :cfoId', { cfoId: query.cfoId });
    if (query.q) {
      qb.andWhere(
        '(user.username ILIKE :q OR user.firstName ILIKE :q OR user.lastName ILIKE :q)',
        { q: `%${query.q}%` },
      );
    }
    return qb.orderBy('user.username', 'ASC').getMany();
  }

  async findByIdOrThrow(id: number) {
    const user = await this.users.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Пользователь не найден');
    return user;
  }

  async create(dto: CreateUserDto) {
    const user = this.users.create({
      ...dto,
      passwordHash: await bcrypt.hash(dto.password, BCRYPT_ROUNDS),
    });
    return this.users.save(user);
  }

  async update(id: number, dto: UpdateUserDto) {
    const user = await this.findByIdOrThrow(id);
    const { password, ...rest } = dto;
    Object.assign(user, rest);
    if (password) {
      user.passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    }
    return this.users.save(user);
  }

  async remove(id: number) {
    const user = await this.findByIdOrThrow(id);
    await this.users.remove(user);
  }
}
