import { AppDataSource } from '../db/data-source';
import { Module } from '../entities/module';

export class ModuleService {
  private moduleRepository = AppDataSource.getRepository(Module);

  async createModule(name: string, description?: string): Promise<Module> {
    const existingModule = await this.moduleRepository.findOneBy({ name });

    if (existingModule) {
      throw new Error('Module already exists');
    }

    const module = this.moduleRepository.create({ name, description });

    return this.moduleRepository.save(module);
  }

  async getAllModules(): Promise<Module[]> {
    return this.moduleRepository.find({
      relations: ['permissions'],
    });
  }

  async getModuleById(id: number): Promise<Module | null> {
    return this.moduleRepository.findOne({
      where: { id },
      relations: ['permissions'],
    });
  }

  async updateModule(id: number, name?: string, description?: string): Promise<Module> {
    const module = await this.moduleRepository.findOneBy({ id });

    if (!module) {
      throw new Error('Module not found');
    }

    if (name !== undefined) {
      const existingModule = await this.moduleRepository.findOneBy({ name });
      if (existingModule && existingModule.id !== id) {
        throw new Error('Module name already exists');
      }
      module.name = name;
    }

    if (description !== undefined) {
      module.description = description;
    }

    return this.moduleRepository.save(module);
  }

  async deleteModule(id: number): Promise<void> {
    const module = await this.moduleRepository.findOne({
      where: { id },
      relations: ['permissions'],
    });

    if (!module) {
      throw new Error('Module not found');
    }

    // Check if module has permissions
    if (module.permissions && module.permissions.length > 0) {
      throw new Error('Cannot delete module that has permissions assigned');
    }

    await this.moduleRepository.remove(module);
  }
}
