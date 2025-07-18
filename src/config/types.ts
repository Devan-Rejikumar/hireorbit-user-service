const TYPES = {
    UserService: Symbol.for("UserService"),
    IUserService:Symbol.for("IUserService"),
    UserRepository: Symbol.for("UserRepository"),
    IUserRepository: Symbol.for("IUserRepository"),
    EmailService: Symbol.for("EmailService"),
    UserController: Symbol.for("UserController"),
    AdminRepository: Symbol.for("AdminRepository"),
    IAdminRepository:Symbol.for("IAdminRepository"),
    AdminService: Symbol.for("AdminService"),
    IAdminService: Symbol.for("IAdminService"),
    AdminController: Symbol.for("AdminController"),
  };
  
  export default TYPES;