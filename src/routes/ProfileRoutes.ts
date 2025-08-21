import { Router } from "express";
import container from "../config/inversify.config";
import TYPES from "../config/types";
import { ProfileController } from "../controllers/ProfileController";
import { authenticateUserJWT } from "../middleware/auth";

const router = Router();
const profileController = container.get<ProfileController>(TYPES.ProfileController);


console.log('=== PROFILE ROUTES DEBUG ===');
console.log('ProfileController instantiated:', !!profileController);


router.get('/debug', (req, res) => {
  res.json({ 
    message: 'Profile routes are working!',
    timestamp: new Date().toISOString()
  });
});


router.post("/",(req, res) => profileController.createProfile(req, res));
router.get("/", (req, res) => profileController.getProfile(req, res));
router.put("/", (req, res) => profileController.updateProfile(req, res));
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
