/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user profile by ID
 *     description: Retrieve public profile information for a user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *         example: 123e4567-e89b-12d3-a456-426614174000
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   allOf:
 *                     - $ref: '#/components/schemas/User'
 *                     - type: object
 *                       properties:
 *                         stats:
 *                           type: object
 *                           properties:
 *                             issuesReported:
 *                               type: integer
 *                             issuesResolved:
 *                               type: integer
 *                             totalPoints:
 *                               type: integer
 *                             badgesEarned:
 *                               type: integer
 *             example:
 *               user:
 *                 id: 123e4567-e89b-12d3-a456-426614174000
 *                 full_name: John Doe
 *                 avatar_url: https://example.com/avatars/user.jpg
 *                 role: citizen
 *                 stats:
 *                   issuesReported: 15
 *                   issuesResolved: 3
 *                   totalPoints: 250
 *                   badgesEarned: 5
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *   put:
 *     summary: Update user profile
 *     description: Update authenticated user's profile information
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID (must match authenticated user)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *                 description: User's full name
 *                 example: John Doe
 *               phone:
 *                 type: string
 *                 description: Phone number
 *                 example: +1-234-567-8900
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Profile avatar image
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /api/users/{id}/issues:
 *   get:
 *     summary: Get user's issues
 *     description: Retrieve all issues reported by a specific user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [reported, acknowledged, in_progress, resolved, closed]
 *         description: Filter by issue status
 *     responses:
 *       200:
 *         description: User issues retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Issue'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /api/users/{id}/rewards:
 *   get:
 *     summary: Get user's rewards
 *     description: Retrieve all rewards earned by a specific user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     responses:
 *       200:
 *         description: User rewards retrieved successfully
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
 *                           earned_at:
 *                             type: string
 *                             format: date-time
 *                             description: When the reward was earned
 *                 totalPoints:
 *                   type: integer
 *                   description: Total points accumulated
 *                 summary:
 *                   type: object
 *                   properties:
 *                     badges:
 *                       type: integer
 *                     certificates:
 *                       type: integer
 *                     vouchers:
 *                       type: integer
 *                     totalRewards:
 *                       type: integer
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /api/users/leaderboard:
 *   get:
 *     summary: Get community leaderboard
 *     description: Retrieve top users based on community engagement and contributions
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [week, month, quarter, year, all]
 *           default: month
 *         description: Time period for leaderboard
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 100
 *         description: Number of top users to return
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [points, issues_reported, issues_resolved, community_engagement]
 *           default: points
 *         description: Ranking criteria
 *     responses:
 *       200:
 *         description: Leaderboard retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 leaderboard:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       rank:
 *                         type: integer
 *                       user:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           full_name:
 *                             type: string
 *                           avatar_url:
 *                             type: string
 *                       score:
 *                         type: integer
 *                       stats:
 *                         type: object
 *                         properties:
 *                           points:
 *                             type: integer
 *                           issuesReported:
 *                             type: integer
 *                           issuesResolved:
 *                             type: integer
 *                 currentUser:
 *                   type: object
 *                   properties:
 *                     rank:
 *                       type: integer
 *                     score:
 *                       type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */