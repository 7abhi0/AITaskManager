import { UserModel } from '../models/User';
import { IUser } from '../shared/types';

export class UserRepository {
  async findById(id: string): Promise<any> {
    return UserModel.findById(id).select('-password');
  }

  async findByEmail(email: string): Promise<any> {
    return UserModel.findOne({ email });
  }

  async create(userData: Partial<IUser> & { password?: string }): Promise<any> {
    const user = new UserModel(userData);
    await user.save();
    const result = user.toObject() as any;
    delete result.password;
    return result;
  }

  async update(id: string, updateData: Partial<IUser>): Promise<any> {
    return UserModel.findByIdAndUpdate(id, { $set: updateData }, { new: true }).select('-password');
  }

  async delete(id: string): Promise<any> {
    return UserModel.findByIdAndDelete(id);
  }

  async findAll(): Promise<any[]> {
    return UserModel.find().select('-password').sort({ createdAt: -1 });
  }

  async count(): Promise<number> {
    return UserModel.countDocuments();
  }
}
