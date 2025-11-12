/**
 * @swagger
 * /api/rewards:
 *   get:
 *     summary: Get available rewards
 *     description: Retrieve list of all available rewards in the system
 *     tags: [Rewards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [badge, points, certificate, voucher]
 *         description: Filter by reward type
 *       - in: query
 *         name: earned
 *         schema:
 *           type: boolean
 *         description: Filter by whether user has earned the reward
 *     responses:
 *       200:
 *         description: Rewards retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 rewards:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/Reward'
 *                       - type: object
 *                         properties:
 *                           earned:
 *                             type: boolean
 *                             description: Whether current user has earned this reward
 *                           progress:
 *                             type: object
 *                             description: User's progress towards earning this reward
 *                             properties:
 *                               current:
 *                                 type: integer
 *                               required:
 *                                 type: integer
 *                               percentage:
 *                                 type: number
 *                                 format: float
 *             example:
 *               rewards:
 *                 - id: 123e4567-e89b-12d3-a456-426614174004
 *                   title: Community Hero Badge
 *                   description: Awarded for reporting 10 confirmed issues
 *                   points: 100
 *                   type: badge
 *                   earned: false
 *                   progress:
 *                     current: 7
 *                     required: 10
 *                     percentage: 70.0
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /api/rewards/{id}:
 *   get:
 *     summary: Get reward details
 *     description: Retrieve detailed information about a specific reward
 *     tags: [Rewards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Reward ID
 *     responses:
 *       200:
 *         description: Reward details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reward:
 *                   allOf:
 *                     - $ref: '#/components/schemas/Reward'
 *                     - type: object
 *                       properties:
 *                         earned:
 *                           type: boolean
 *                         earnedAt:
 *                           type: string
 *                           format: date-time
 *                         progress:
 *                           type: object
 *                           properties:
 *                             current:
 *                               type: integer
 *                             required:
 *                               type: integer
 *                             percentage:
 *                               type: number
 *                         recipients:
 *                           type: object
 *                           properties:
 *                             total:
 *                               type: integer
 *                             recent:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   user:
 *                                     type: object
 *                                     properties:
 *                                       id:
 *                                         type: string
 *                                       full_name:
 *                                         type: string
 *                                       avatar_url:
 *                                         type: string
 *                                   earned_at:
 *                                     type: string
 *                                     format: date-time
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /api/rewards/claim/{id}:
 *   post:
 *     summary: Claim a reward
 *     description: Claim an available reward that the user has earned
 *     tags: [Rewards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Reward ID
 *     responses:
 *       200:
 *         description: Reward claimed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 reward:
 *                   $ref: '#/components/schemas/Reward'
 *                 claimedAt:
 *                   type: string
 *                   format: date-time
 *             example:
 *               message: Congratulations! You have earned the Community Hero Badge
 *               reward:
 *                 id: 123e4567-e89b-12d3-a456-426614174004
 *                 title: Community Hero Badge
 *                 points: 100
 *               claimedAt: "2024-01-15T10:30:00Z"
 *       400:
 *         description: Reward not available or already claimed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: ValidationError
 *               message: This reward has already been claimed or you don't meet the requirements
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /api/rewards/progress:
 *   get:
 *     summary: Get user's reward progress
 *     description: Retrieve user's progress towards earning all available rewards
 *     tags: [Rewards]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reward progress retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalRewards:
 *                       type: integer
 *                     earnedRewards:
 *                       type: integer
 *                     availableRewards:
 *                       type: integer
 *                     totalPoints:
 *                       type: integer
 *                 progress:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       reward:
 *                         $ref: '#/components/schemas/Reward'
 *                       earned:
 *                         type: boolean
 *                       current:
 *                         type: integer
 *                       required:
 *                         type: integer
 *                       percentage:
 *                         type: number
 *                       nextMilestone:
 *                         type: string
 *                         description: Description of what user needs to do next
 *             example:
 *               summary:
 *                 totalRewards: 15
 *                 earnedRewards: 7
 *                 availableRewards: 2
 *                 totalPoints: 450
 *               progress:
 *                 - reward:
 *                     id: 123e4567-e89b-12d3-a456-426614174004
 *                     title: Community Hero Badge
 *                     description: Report 10 confirmed issues
 *                     points: 100
 *                   earned: false
 *                   current: 8
 *                   required: 10
 *                   percentage: 80.0
 *                   nextMilestone: Report 2 more issues to earn this badge
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */