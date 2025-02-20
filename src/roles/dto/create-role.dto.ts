import { IsString, IsArray, IsNotEmpty, MinLength, IsOptional } from 'class-validator';

export class CreateRoleDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(2)
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    permissions?: string[];
}
