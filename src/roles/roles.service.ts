import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role, RoleDocument } from './roles.schema';

@Injectable()
export class RolesService {
    constructor(
        @InjectModel(Role.name) private roleModel: Model<RoleDocument>
    ) { }

    async findAll(): Promise<Role[]> {
        return this.roleModel.find().exec();
    }

    async findById(id: string): Promise<Role> {
        const role = await this.roleModel.findById(id).exec();
        if (!role) {
            throw new NotFoundException(`Role with ID ${id} not found`);
        }
        return role;
    }

    async create(roleData: Partial<Role>): Promise<Role> {
        const newRole = new this.roleModel(roleData);
        return newRole.save();
    }

    async update(id: string, roleData: Partial<Role>): Promise<Role> {
        const updatedRole = await this.roleModel
            .findByIdAndUpdate(id, roleData, { new: true })
            .exec();
        if (!updatedRole) {
            throw new NotFoundException(`Role with ID ${id} not found`);
        }
        return updatedRole;
    }
}
