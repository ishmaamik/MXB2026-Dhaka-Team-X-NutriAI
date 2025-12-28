import express from "express";
import { resourcesController } from "./resources-controller";
import { requireAuth } from "@clerk/express";

const router = express.Router();


router.get("/", resourcesController.getAllResources);

router.get("/tags", resourcesController.getAllResourceTags);

router.get("/personalized", requireAuth(), resourcesController.getPersonalizedRecommendations);

// Search endpoints
router.get("/search/articles", resourcesController.searchArticles);
router.get("/search/videos", resourcesController.searchVideos);
router.get("/feed/foodista", resourcesController.getFoodistaFeed);

// Import endpoint
router.post('/import', requireAuth(), resourcesController.importResource);

router.get("/:id", resourcesController.getResourceById);

// CRUD operations (auth required)
router.post("/", requireAuth(), resourcesController.createResource);

router.put("/:id", requireAuth(), resourcesController.updateResource);

router.delete("/:id", requireAuth(), resourcesController.deleteResource);


export { router as resourcesRouter };