import { Router } from "express";
import container from "../config/inversify.config";
import TYPES from "../config/types";
import { ProfileController } from "../controllers/ProfileController";
import multer from 'multer';
import path from "path";


const router = Router();
const profileController = container.get<ProfileController>(TYPES.ProfileController);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});


console.log('=== PROFILE ROUTES DEBUG ===');
console.log('ProfileController instantiated:', !!profileController);


router.get('/debug', (req, res) => {
  res.json({ 
    message: 'Profile routes are working!',
    timestamp: new Date().toISOString(),
    cloudinaryConfig: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME ? 'Set' : 'Missing',
      apiKey: process.env.CLOUDINARY_API_KEY ? 'Set' : 'Missing',
      apiSecret: process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Missing'
    }
  });
});


router.get('/current', (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    res.status(401).json({ error: 'User not authenticated' });
    return;
  }
  
  
  const container = require("../config/inversify.config").default;
  const TYPES = require("../config/types").default;
  const profileService = container.get(TYPES.IProfileService);
  
  profileService.getProfile(userId).then((profile: any) => {
    res.json({ 
      success: true,
      data: { profile },
      message: 'Current profile fetched successfully'
    });
  }).catch((error: any) => {
    res.status(500).json({ error: error.message });
  });
});


router.post("/",(req, res) => profileController.createProfile(req, res));
router.get("/", (req, res) => profileController.getProfile(req, res));

router.put('/', (req, res, next) => {
  if (req.headers['content-type']?.includes('multipart/form-data')) {
    upload.single('profilePicture')(req, res, next);
  } else {
    next();
  }
}, (req, res) => profileController.updateProfile(req, res));
router.delete("/",(req, res) => profileController.deleteProfile(req, res));

router.get("/full", (req, res, next) => {
  console.log('=== /full route hit ===');
  console.log('Request URL:', req.url);
  console.log('Request method:', req.method);
  next();
}, (req, res) => profileController.getFullProfile(req, res));


router.post("/experience", (req, res) => profileController.addExperience(req, res));
router.put("/experience/:id", (req, res) => profileController.updateExperience(req, res));
router.delete("/experience/:id", (req, res) => profileController.deleteExperience(req, res));


router.post("/education", (req, res) => profileController.addEducation(req, res));
router.put("/education/:id",  (req, res) => profileController.updateEducation(req, res));
router.delete("/education/:id",  (req, res) => profileController.deleteEducation(req, res));

export default router;
