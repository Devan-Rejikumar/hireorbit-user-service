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


router.post("/", authenticateUserJWT, (req, res) => profileController.createProfile(req, res));
router.get("/", authenticateUserJWT, (req, res) => profileController.getProfile(req, res));
router.put("/", authenticateUserJWT, (req, res) => profileController.updateProfile(req, res));
router.delete("/", authenticateUserJWT, (req, res) => profileController.deleteProfile(req, res));

router.get("/full", (req, res, next) => {
  console.log('=== /full route hit ===');
  console.log('Request URL:', req.url);
  console.log('Request method:', req.method);
  next();
}, authenticateUserJWT, (req, res) => profileController.getFullProfile(req, res));


router.post("/experience", authenticateUserJWT, (req, res) => profileController.addExperience(req, res));
router.put("/experience/:id", authenticateUserJWT, (req, res) => profileController.updateExperience(req, res));
router.delete("/experience/:id", authenticateUserJWT, (req, res) => profileController.deleteExperience(req, res));


router.post("/education", authenticateUserJWT, (req, res) => profileController.addEducation(req, res));
router.put("/education/:id", authenticateUserJWT, (req, res) => profileController.updateEducation(req, res));
router.delete("/education/:id", authenticateUserJWT, (req, res) => profileController.deleteEducation(req, res));

export default router;
