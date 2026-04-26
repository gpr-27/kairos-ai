import { Router } from 'express';

import { healthRouter } from './health.routes.js';
import { problemRouter } from './problem.routes.js';
import { submissionRouter } from './submission.routes.js';
import { userRouter } from './user.routes.js';
import { discussionRouter } from './discussion.routes.js';
import { playgroundRouter } from './playground.routes.js';

const router = Router();

router.use('/health', healthRouter);
router.use('/problems', problemRouter);
router.use('/submissions', submissionRouter);
router.use('/users', userRouter);
router.use('/discussions', discussionRouter);
router.use('/playground', playgroundRouter);

export { router as apiRouter };
