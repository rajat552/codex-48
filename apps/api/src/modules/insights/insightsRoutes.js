import express from 'express';
import { InsightsController } from './insightsController.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requireWorkspaceMember } from '../../middleware/requireWorkspaceMember.js';

export const insightsRouter = express.Router({ mergeParams: true });

insightsRouter.use(authenticate);
insightsRouter.use(requireWorkspaceMember);

insightsRouter.get('/', InsightsController.getInsights);
