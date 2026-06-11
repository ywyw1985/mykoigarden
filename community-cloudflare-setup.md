# My Koi Garden Community Setup

The PWA pages, upload forms, comment forms, and moderation UI are already in the site code. To make submissions persist online, create these Cloudflare resources:

1. Create a D1 database.
   - Suggested name: `mykoigarden-community`
   - Worker binding name: `MKG_DB`
   - Run the SQL in `community-schema.sql`.

2. Create an R2 bucket.
   - Suggested name: `mykoigarden-uploads`
   - Worker binding name: `MKG_UPLOADS`
   - This stores visitor image uploads before review.

3. Add a Worker secret.
   - Secret name: `ADMIN_SECRET`
   - Use a long private password.
   - Open `/admin/community.html` and enter this value to review submissions.

4. Keep moderation enabled.
   - Visitor questions are inserted as `pending`.
   - Visitor images are inserted as `pending`.
   - Approved comments appear publicly on the community page.
   - Email addresses stay private and are not returned by the public API.

Useful pages:

- Public app/community page: `/community.html`
- Chinese community page: `/zh/community.html`
- Spanish community page: `/es/community.html`
- Japanese community page: `/ja/community.html`
- Moderation page: `/admin/community.html`
