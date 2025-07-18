import "reflect-metadata";
import { Container } from "inversify";
import TYPES from "./types";
import { UserService } from "../services/UserService";
import { UserRepository } from "../repositories/UserRepository";
import { EmailService } from "../services/EmailService";
import { UserController } from "../controllers/UserController";
import { AdminRepository } from "../repositories/AdminRepository";
import { AdminService } from "../services/AdminService";
import { AdminController } from "../controllers/AdminController";
import { IUserRepository } from "../repositories/IUserRepository";
import { IAdminRepository } from "../repositories/IAdminRepository";
import { IAdminService } from "../services/IAdminService";
import { IUserService } from "../services/IUserService";


const container = new Container();

container.bind<UserService>(TYPES.UserService).to(UserService);
container.bind<IUserService>(TYPES.IUserService).to(UserService);
container.bind<IUserRepository>(TYPES.IUserRepository).to(UserRepository)
// container.bind<UserRepository>(TYPES.UserRepository).to(UserRepository);
container.bind<EmailService>(TYPES.EmailService).to(EmailService);
container.bind<UserController>(TYPES.UserController).to(UserController);
container.bind<AdminRepository>(TYPES.AdminRepository).to(AdminRepository);
container.bind<IAdminRepository>(TYPES.IAdminRepository).to(AdminRepository);
container.bind<AdminService>(TYPES.AdminService).to(AdminService);
container.bind<IAdminService>(TYPES.IAdminService).to(AdminService);
container.bind<AdminController>(TYPES.AdminController).to(AdminController);


export default container;