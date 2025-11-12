/**
 * @swagger
 * /api/ai/analyze-issue:
 *   post:
 *     summary: Analyze issue with AI
 *     description: Use AI to analyze issue description and images for categorization and priority suggestions
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - description
 *             properties:
 *               description:
 *                 type: string
 *                 description: Issue description to analyze
 *                 example: There is a large pothole on Main Street that is causing damage to vehicles
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Issue images for analysis (max 3 files)
 *               location:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *                   address:
 *                     type: string
 *     responses:
 *       200:
 *         description: Issue analysis completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 analysis:
 *                   type: object
 *                   properties:
 *                     suggestedCategory:
 *                       type: string
 *                       enum: [infrastructure, safety, environment, transportation, utilities, other]
 *                       description: AI-suggested category
 *                       example: infrastructure
 *                     suggestedPriority:
 *                       type: string
 *                       enum: [low, medium, high, critical]
 *                       description: AI-suggested priority level
 *                       example: high
 *                     confidence:
 *                       type: object
 *                       properties:
 *                         category:
 *                           type: number
 *                           format: float
 *                           minimum: 0
 *                           maximum: 1
 *                           description: Confidence score for category suggestion
 *                           example: 0.92
 *                         priority:
 *                           type: number
 *                           format: float
 *                           minimum: 0
 *                           maximum: 1
 *                           description: Confidence score for priority suggestion
 *                           example: 0.85
 *                     keywords:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Key terms extracted from description
 *                       example: [pothole, damage, vehicles, road]
 *                     imageAnalysis:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           filename:
 *                             type: string
 *                           objects:
 *                             type: array
 *                             items:
 *                               type: string
 *                           confidence:
 *                             type: number
 *                           description:
 *                             type: string
 *                     similarIssues:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           title:
 *                             type: string
 *                           similarity:
 *                             type: number
 *                             format: float
 *                           status:
 *                             type: string
 *             example:
 *               analysis:
 *                 suggestedCategory: infrastructure
 *                 suggestedPriority: high
 *                 confidence:
 *                   category: 0.92
 *                   priority: 0.85
 *                 keywords:
 *                   - pothole
 *                   - damage
 *                   - vehicles
 *                   - road
 *                 imageAnalysis:
 *                   - filename: pothole1.jpg
 *                     objects: [road, damage, asphalt]
 *                     confidence: 0.89
 *                     description: Image shows road surface damage consistent with pothole
 *                 similarIssues:
 *                   - id: 456e7890-e89b-12d3-a456-426614174002
 *                     title: Road damage near intersection
 *                     similarity: 0.78
 *                     status: resolved
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /api/ai/generate-report:
 *   post:
 *     summary: Generate AI report for issues
 *     description: Generate comprehensive analysis report for issues in a specific area or timeframe
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *       - apiKey: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               filters:
 *                 type: object
 *                 properties:
 *                   location:
 *                     type: object
 *                     properties:
 *                       latitude:
 *                         type: number
 *                       longitude:
 *                         type: number
 *                       radius:
 *                         type: number
 *                   timeframe:
 *                     type: object
 *                     properties:
 *                       start:
 *                         type: string
 *                         format: date-time
 *                       end:
 *                         type: string
 *                         format: date-time
 *                   categories:
 *                     type: array
 *                     items:
 *                       type: string
 *                       enum: [infrastructure, safety, environment, transportation, utilities, other]
 *                   priorities:
 *                     type: array
 *                     items:
 *                       type: string
 *                       enum: [low, medium, high, critical]
 *               reportType:
 *                 type: string
 *                 enum: [summary, detailed, trends, predictions]
 *                 default: summary
 *                 description: Type of report to generate
 *           example:
 *             filters:
 *               location:
 *                 latitude: 40.7128
 *                 longitude: -74.0060
 *                 radius: 5000
 *               timeframe:
 *                 start: "2024-01-01T00:00:00Z"
 *                 end: "2024-01-31T23:59:59Z"
 *               categories: [infrastructure, safety]
 *             reportType: detailed
 *     responses:
 *       200:
 *         description: Report generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 report:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     title:
 *                       type: string
 *                     summary:
 *                       type: string
 *                     statistics:
 *                       type: object
 *                       properties:
 *                         totalIssues:
 *                           type: integer
 *                         byCategory:
 *                           type: object
 *                         byPriority:
 *                           type: object
 *                         byStatus:
 *                           type: object
 *                         resolutionRate:
 *                           type: number
 *                         averageResolutionTime:
 *                           type: number
 *                     insights:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                           title:
 *                             type: string
 *                           description:
 *                             type: string
 *                           data:
 *                             type: object
 *                     recommendations:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           priority:
 *                             type: string
 *                           title:
 *                             type: string
 *                           description:
 *                             type: string
 *                           estimatedImpact:
 *                             type: string
 *                     generatedAt:
 *                       type: string
 *                       format: date-time
 *                 downloadUrl:
 *                   type: string
 *                   format: uri
 *                   description: URL to download full report as PDF
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
 * /api/ai/suggest-solutions:
 *   post:
 *     summary: Get AI-powered solution suggestions
 *     description: Get AI-generated suggestions for resolving specific issues based on historical data and best practices
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - issueId
 *             properties:
 *               issueId:
 *                 type: string
 *                 format: uuid
 *                 description: Issue ID to get solutions for
 *               includeResources:
 *                 type: boolean
 *                 default: true
 *                 description: Include resource estimation in suggestions
 *               includeCost:
 *                 type: boolean
 *                 default: false
 *                 description: Include cost estimation (admin only)
 *     responses:
 *       200:
 *         description: Solution suggestions generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 suggestions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       steps:
 *                         type: array
 *                         items:
 *                           type: string
 *                       estimatedTime:
 *                         type: string
 *                       difficulty:
 *                         type: string
 *                         enum: [easy, moderate, hard]
 *                       confidence:
 *                         type: number
 *                         format: float
 *                       resources:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             type:
 *                               type: string
 *                             quantity:
 *                               type: string
 *                             description:
 *                               type: string
 *                       similarCases:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             issueId:
 *                               type: string
 *                             outcome:
 *                               type: string
 *                             timeToResolve:
 *                               type: string
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     generatedAt:
 *                       type: string
 *                       format: date-time
 *                     basedOn:
 *                       type: string
 *                       description: Data sources used for suggestions
 *                     confidence:
 *                       type: number
 *                       format: float
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /api/ai/moderate-content:
 *   post:
 *     summary: Content moderation using AI
 *     description: Check content for inappropriate material, spam, or policy violations
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *       - apiKey: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *               - type
 *             properties:
 *               content:
 *                 type: string
 *                 description: Content to moderate
 *               type:
 *                 type: string
 *                 enum: [text, image_url]
 *                 description: Type of content being moderated
 *               context:
 *                 type: object
 *                 properties:
 *                   issueId:
 *                     type: string
 *                     format: uuid
 *                   userId:
 *                     type: string
 *                     format: uuid
 *                   contentType:
 *                     type: string
 *                     enum: [issue_description, comment, user_profile]
 *           example:
 *             content: This pothole has been here for months and nothing is being done!
 *             type: text
 *             context:
 *               issueId: 123e4567-e89b-12d3-a456-426614174001
 *               contentType: issue_description
 *     responses:
 *       200:
 *         description: Content moderation completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: object
 *                   properties:
 *                     approved:
 *                       type: boolean
 *                       description: Whether content passes moderation
 *                     confidence:
 *                       type: number
 *                       format: float
 *                       description: Confidence score of the decision
 *                     flags:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                             enum: [inappropriate, spam, offensive, misinformation]
 *                           severity:
 *                             type: string
 *                             enum: [low, medium, high]
 *                           description:
 *                             type: string
 *                     suggestions:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Suggestions for content improvement if not approved
 *                 moderatedContent:
 *                   type: string
 *                   description: Content with automatic corrections applied (if applicable)
 *             example:
 *               result:
 *                 approved: true
 *                 confidence: 0.96
 *                 flags: []
 *                 suggestions: []
 *               moderatedContent: This pothole has been here for months and nothing is being done!
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */