# Detailed Remaining Work Backlog

> Master status and deduplicated checklist: [docs/master-project-worklist.md](./master-project-worklist.md). Update the master document first; this file is retained as legacy reference.

Updated: 2026-07-10

This document breaks the remaining product, UX, testing and operational work into trackable sub-tasks. Completed work remains summarized in `docs/ux-ui-master-roadmap.md`.

## Summary

- Remaining major workstreams: 7
- Estimated remaining sub-tasks: 309
- Estimated coding tasks: 200–220
- Estimated QA, regression, CI and documentation tasks: 80–100
- Current overall completion estimate: 70–75% when edge cases, permissions and regression are included

# 1. Profile and Security

## Profile overview

1. Create profile overview route
2. Load real member data
3. Show username
4. Show phone
5. Show email
6. Show account status
7. Show registration date
8. Show member tier
9. Show KYC status
10. Show wallet summary
11. Mobile layout
12. Tablet layout
13. Desktop layout
14. Loading state
15. Empty state
16. Error state
17. Retry state

## Edit profile

18. Edit display name
19. Edit phone
20. Edit email
21. Field validation
22. Duplicate phone/email handling
23. Saving state
24. Success state
25. Error summary
26. Confirmation dialog
27. Unsaved-changes warning

## Password change

28. Current password field
29. New password field
30. Confirm password field
31. Password strength
32. Password mismatch validation
33. Password visibility controls
34. Submit loading state
35. Success feedback
36. Forced re-login after change
37. Session invalidation handling

## Sessions and devices

38. Active session list
39. Device name
40. IP address
41. Last active time
42. Current-session badge
43. Revoke one session
44. Revoke all other sessions
45. Confirmation dialog
46. Empty state
47. Expired-session handling

## Security status

48. 2FA status
49. Suspicious-login alert
50. Last password-change time
51. Recent login history
52. Risk summary
53. Danger zone
54. Account-lock state
55. Self-disable flow when supported by backend

Estimated sub-tasks: 55

# 2. Notifications

## Notification list

56. Create notifications route
57. Load real notifications
58. Group by date
59. Unread indicator
60. Notification-type icon
61. Title
62. Message
63. Timestamp
64. Deep link
65. Loading state
66. Empty state
67. Error state
68. Retry state

## Notification actions

69. Mark one as read
70. Mark all as read
71. Archive notification
72. Delete notification when backend supports it
73. Optimistic update
74. Rollback on API failure

## Preferences

75. Create notification preferences route
76. Email toggle
77. SMS toggle
78. Push toggle
79. Finance-alert toggle
80. Promotion-alert toggle
81. Security-alert toggle
82. System-alert toggle
83. Saving state
84. Unsaved-changes warning
85. Success feedback
86. Error feedback

## Responsive and accessibility

87. Mobile cards
88. Desktop list/detail layout
89. Keyboard navigation
90. Screen-reader labels
91. Long Thai text handling
92. 200% zoom support

Estimated sub-tasks: 37

# 3. Support Tickets and FAQ

## Support landing

93. Create support route
94. Contact channels
95. FAQ highlights
96. Ticket summary
97. Open-ticket summary
98. Quick actions

## Ticket list

99. Load ticket list
100. Status filter
101. Ticket search
102. Pagination
103. Mobile cards
104. Desktop list
105. Loading state
106. Empty state
107. Error state

## Create ticket

108. Subject field
109. Category selector
110. Message field
111. Attachment upload
112. File-type validation
113. File-size validation
114. Submit loading state
115. Success state
116. Error state
117. Draft preservation

## Ticket detail

118. Ticket header
119. Status badge
120. Conversation timeline
121. Agent replies
122. Member replies
123. Attachment preview
124. Send reply
125. Close ticket
126. Reopen when supported
127. Polling or realtime refresh
128. Error retry

## FAQ

129. FAQ search
130. Category filter
131. Accordion
132. Keyboard controls
133. Deep links
134. Empty-search state
135. Analytics hook when available

Estimated sub-tasks: 43

# 4. Admin Settings

## Branding

136. Site name
137. Logo URL
138. Favicon
139. Primary color
140. Background color
141. Card color
142. Text color
143. Live preview
144. Color validation
145. Contrast warning

## Feature toggles

146. Login enabled
147. Registration enabled
148. Deposit enabled
149. Withdrawal enabled
150. Games enabled
151. Promotions enabled
152. Global maintenance
153. Member maintenance
154. Admin maintenance
155. Confirmation for critical toggles

## Contact settings

156. LINE
157. Telegram
158. Facebook
159. Phone
160. Email
161. Live-chat URL
162. Support hours
163. Address
164. URL validation

## Legal settings

165. Terms content
166. Privacy content
167. Responsible-use content
168. Versioning
169. Published date
170. Preview

## Promotion settings

171. Campaign list
172. Create campaign
173. Edit campaign
174. Delete campaign
175. Enable or disable
176. Start date
177. End date
178. Priority
179. Bonus type
180. Bonus value
181. Maximum bonus
182. Minimum deposit
183. Turnover multiplier
184. Image URL
185. Badge text
186. Claim mode
187. Validation
188. Preview

## Settings UX

189. Settings search
190. Section navigation
191. Sticky save bar
192. Unsaved-changes warning
193. Reset defaults
194. Save loading state
195. Success feedback
196. Error summary
197. Role and permission guard
198. Audit-log entry

Estimated sub-tasks: 63

# 5. Reports, Activity, Risk and Security Admin

## Reports

199. Responsive report layout
200. Date range
201. Report-type filter
202. Deposit summary
203. Withdrawal summary
204. Net flow
205. Member growth
206. Promotion usage
207. Game activity
208. CSV export when supported
209. Loading state
210. Empty state
211. Error state

## Activity

212. Activity timeline
213. Actor filter
214. Action filter
215. Entity filter
216. Date filter
217. Pagination
218. Detail drawer
219. Metadata viewer
220. Long-JSON handling
221. Mobile cards
222. Desktop table

## Risk

223. Risk-alert list
224. Risk score
225. Severity filters
226. Suspicious login
227. Suspicious withdrawal
228. Account mismatch
229. Repeated failed login
230. Member drilldown
231. Resolve alert
232. Add note
233. Audit log
234. Mobile fallback

## Security admin

235. Security-event list
236. Revoke session
237. Lock account
238. Unlock account
239. Trigger password reset when supported
240. Confirmation dialogs
241. Permission checks

Estimated sub-tasks: 43

# 6. Authenticated Visual Regression

242. Safe member test account
243. Safe admin test account
244. Seed-safe test data
245. Member login setup
246. Admin login setup
247. Playwright storage state
248. Member Home screenshots
249. Deposit screenshots
250. Withdrawal screenshots
251. Transactions screenshots
252. Bank Accounts screenshots
253. Games screenshots
254. Promotions screenshots
255. Admin Dashboard screenshots
256. Top-up Queue screenshots
257. Withdrawal Queue screenshots
258. Members screenshots
259. Wallet Ledgers screenshots
260. Six-viewport coverage
261. Baseline generation
262. Baseline review
263. Diff-threshold tuning
264. Artifact upload
265. Failure-triage guide
266. Secret handling
267. Protected CI test job

Estimated sub-tasks: 26

# 7. Manual Money-flow Regression

## Deposit

268. Select method
269. Amount validation
270. Invalid amount
271. Slip upload
272. Invalid file
273. Slip preview
274. Submit
275. Retry
276. Waiting state
277. Approved state
278. Rejected state
279. Duplicate submit protection
280. Network failure

## Withdrawal

281. Select bank
282. Amount validation
283. Insufficient balance
284. Bonus-turnover block
285. Confirmation
286. Submit
287. Retry
288. Waiting state
289. Completed state
290. Rejected state
291. Locked-balance return
292. Duplicate submit protection

## Admin Top-up

293. Claim
294. Claim conflict
295. Release
296. Approve
297. Reject
298. Missing slip
299. Audit note
300. Concurrent update

## Admin Withdrawal

301. Claim
302. Claim conflict
303. Release
304. Complete
305. Reject
306. Missing reason
307. Account verification
308. Locked-balance handling
309. Concurrent update

Estimated sub-tasks: 42

# Priority order

1. Profile and Security
2. Notifications
3. Support Tickets and FAQ
4. Admin Settings
5. Reports, Activity, Risk and Security Admin
6. Authenticated Visual Regression
7. Manual Money-flow Regression

# Completion rule

A sub-task is complete only when its API behavior is preserved, responsive layouts work at all six standard viewports, keyboard and focus behavior are verified, loading/error/empty/success states are covered, and relevant build or regression checks pass.
