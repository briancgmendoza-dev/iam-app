import { AppDataSource } from './data-source';
import { User } from '../entities/user';
import { Group } from '../entities/group';
import { Role } from '../entities/role';
import { Module } from '../entities/module';
import { Permission } from '../entities/permission';
import bcrypt from 'bcryptjs';

export async function seedDatabase() {
  try {
    console.log('Starting database seeding...');

    const userRepo = AppDataSource.getRepository(User);
    const existingAdmin = await userRepo.findOneBy({ username: 'admin' });

    if (existingAdmin) {
      console.log('Database already seeded, skipping...');
      return;
    }

    console.log('Creating modules...');
    const moduleRepo = AppDataSource.getRepository(Module);
    const modules = await moduleRepo.save([
      { name: 'Users', description: 'User management' },
      { name: 'Groups', description: 'Group management' },
      { name: 'Roles', description: 'Role management' },
      { name: 'Modules', description: 'Module management' },
      { name: 'Permissions', description: 'Permission management' },
    ]);
    console.log(`Created ${modules.length} modules`);

    console.log('Creating permissions...');
    const permissionRepo = AppDataSource.getRepository(Permission);
    const permissions = [];
    const actions = ['create', 'read', 'update', 'delete'];

    for (const module of modules) {
      for (const action of actions) {
        permissions.push({
          action,
          module,
          description: `${action} ${module.name.toLowerCase()}`,
        });
      }
    }

    const savedPermissions = await permissionRepo.save(permissions);
    console.log(`Created ${savedPermissions.length} permissions`);

    console.log('Creating Super Admin role...');
    const roleRepo = AppDataSource.getRepository(Role);
    const superAdminRole = await roleRepo.save({
      name: 'Super Admin',
      description: 'Full system access - can perform all operations',
      permissions: savedPermissions,
    });
    console.log('Created Super Admin role');

    console.log('Creating Admin group...');
    const groupRepo = AppDataSource.getRepository(Group);
    const adminGroup = await groupRepo.save({
      name: 'Administrators',
      description: 'System administrators with full access',
      roles: [superAdminRole],
    });
    console.log('Created Admin group');

    console.log('Creating default admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminUser = await userRepo.save({
      username: 'admin',
      password: hashedPassword,
      groups: [adminGroup],
    });
    console.log('Created default admin user');

    console.log('Creating basic user role and group...');
    const userRole = await roleRepo.save({
      name: 'User',
      description: 'Basic user access',
      permissions: savedPermissions.filter(p => p.action === 'read'), // Only read permissions
    });

    const userGroup = await groupRepo.save({
      name: 'Users',
      description: 'Regular users with basic access',
      roles: [userRole],
    });
    console.log('Created User role and group');

    console.log('Database seeding completed successfully!');
    console.log('Summary:');
    console.log(`   • Modules: ${modules.length}`);
    console.log(`   • Permissions: ${savedPermissions.length}`);
    console.log(`   • Roles: 2 (Super Admin, User)`);
    console.log(`   • Groups: 2 (Administrators, Users)`);
    console.log(`   • Default Admin User: admin / admin123`);
    console.log('Login with: username="admin", password="admin123"');
  } catch (error) {
    console.error('Database seeding failed:', error);
    throw error;
  }
}
