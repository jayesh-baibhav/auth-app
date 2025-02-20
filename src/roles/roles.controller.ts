import { Controller, Get, Post, Put, Param, Body, UseGuards } from '@nestjs/common';
import { RolesService } from './roles.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role as RoleEnum } from '../common/enums/role.enum';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Controller('api/roles')
@UseGuards(AuthGuard, RolesGuard)
export class RolesController {
    constructor(private readonly rolesService: RolesService) { }

    @Get()
    @Roles(RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN)
    findAll() {
        return this.rolesService.findAll();
    }

    @Get(':id')
    @Roles(RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN)
    findOne(@Param('id') id: string) {
        return this.rolesService.findById(id);
    }

    @Post()
    @Roles(RoleEnum.SUPER_ADMIN)
    create(@Body() roleData: CreateRoleDto) {
        return this.rolesService.create(roleData);
    }

    @Put(':id')
    @Roles(RoleEnum.SUPER_ADMIN)
    update(@Param('id') id: string, @Body() roleData: UpdateRoleDto) {
        return this.rolesService.update(id, roleData);
    }
}
