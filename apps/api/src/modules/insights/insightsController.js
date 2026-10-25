import { InsightsService } from './insightsService.js';

export class InsightsController {
  static async getInsights(req, res, next) {
    try {
      const { from, to } = req.query;
      const insights = await InsightsService.getWorkspaceInsights({
        workspaceId: req.workspace._id,
        from,
        to
      });

      return res.status(200).json({
        data: insights,
        meta: { requestId: req.requestId }
      });
    } catch (err) {
      next(err);
    }
  }
}
