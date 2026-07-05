import { UserModel, IUserDocument } from '../models/User';
import { IUser } from '../shared/types';

export class UserRepository {
  async findById(id: string): Promise<IUser | null> {
    const doc = await UserModel.findById(id).select('-password').exec();
    return doc ? (doc.toObject() as unknown as IUser) : null;
  }

  async findByEmail(email: string): Promise<IUserDocument | null> {
    const doc = await UserModel.findOne({ email }).exec();
    return doc || null;
  }

  async create(userData: Partial<IUser> & { password?: string }): Promise<IUser> {
    const user = new UserModel(userData);
    await user.save();
    const result = user.toObject() as unknown as Record<string, unknown>;
    delete result.password;
    return result as unknown as IUser;
  }

  async update(id: string, updateData: Partial<IUser>): Promise<IUser | null> {
    const doc = await UserModel.findByIdAndUpdate(id, { $set: updateData }, { new: true })
      .select('-password')
      .exec();
    return doc ? (doc.toObject() as unknown as IUser) : null;
  }

  async delete(id: string): Promise<IUser | null> {
    const doc = await UserModel.findByIdAndDelete(id).exec();
    return doc ? (doc.toObject() as unknown as IUser) : null;
  }

  async findAll(): Promise<IUser[]> {
    const docs = await UserModel.find().select('-password').sort({ createdAt: -1 }).exec();
    return docs.map(doc => doc.toObject() as unknown as IUser);
  }

  async count(): Promise<number> {
    return UserModel.countDocuments().exec();
  }
}
