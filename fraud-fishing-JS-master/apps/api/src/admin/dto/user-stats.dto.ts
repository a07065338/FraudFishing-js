import { ApiProperty } from '@nestjs/swagger';

export class UserStatsDto {
  @ApiProperty({ example: 1, description: 'ID del usuario' })
  id: number;

  @ApiProperty({ example: 'Juan Pérez', description: 'Nombre del usuario' })
  name: string;

  @ApiProperty({ example: 'juan@email.com', description: 'Email del usuario' })
  email: string;

  @ApiProperty({ example: false, description: 'Si es administrador' })
  is_admin: boolean;

  @ApiProperty({ example: 5, description: 'Cantidad de reportes creados' })
  reportCount: number;

  @ApiProperty({ example: 12, description: 'Cantidad de comentarios realizados' })
  commentCount: number;

  @ApiProperty({ example: 8, description: 'Cantidad de likes dados' })
  likeCount: number;

  @ApiProperty({ example: '2024-01-15T10:30:00Z', description: 'Fecha de creación' })
  created_at: Date;
}

export class UserStatsResponseDto {
  @ApiProperty({ type: [UserStatsDto] })
  users: UserStatsDto[];

  @ApiProperty({ example: 25, description: 'Total de usuarios' })
  totalUsers: number;

  @ApiProperty({ example: 3, description: 'Total de administradores' })
  totalAdmins: number;

  @ApiProperty({ example: 22, description: 'Total de usuarios regulares' })
  totalRegularUsers: number;
}