# Important Notes for Render Deployment

## Database Persistence Issue

⚠️ **Render Free Tier Limitation**: The filesystem on Render's free tier is **ephemeral**, meaning:
- SQLite database will be **reset on every deployment**
- Data is **lost when the service restarts** (which happens after 15 minutes of inactivity)
- Evaluation history, dashboard analytics, and saved evaluations will **not persist**

### Solutions:

#### Option 1: Upgrade to Render Paid Plan
- Paid plans offer persistent disks
- Add a persistent disk to your service
- Update `DATABASE_PATH` to point to the persistent disk mount

#### Option 2: Use External Database (Recommended for Production)
- Switch to PostgreSQL (Render offers free PostgreSQL)
- Use a managed database service (e.g., Supabase, PlanetScale)
- Modify the backend to use PostgreSQL instead of SQLite

#### Option 3: Accept Temporary Storage
- Keep current setup for testing/demo purposes
- Data will reset periodically but basic functionality works
- Good for portfolio/showcase purposes

### For Now:
The current setup works for **testing and demonstrations**. Users can:
- ✅ Evaluate metadata and get scores
- ✅ See evaluations in history (until service restarts)
- ✅ View dashboard analytics (until service restarts)
- ✅ Compare evaluations (until service restarts)

But **data will not persist** across service restarts.

---

## To Add PostgreSQL Support:

1. Create a PostgreSQL database on Render
2. Install `pg` package: `npm install pg`
3. Update database code to support PostgreSQL
4. Set `DATABASE_URL` environment variable in Render
