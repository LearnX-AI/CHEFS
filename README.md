# chef-registration

Semester 2 registration form built with Next.js, MySQL, and Prisma.

## Backend setup

1. Install dependencies:

```bash
npm install
```

2. Create a MySQL database:

```sql
CREATE DATABASE chef_registration;
```

3. Create a local `.env` file from `.env.example` and set your MySQL URL:

```bash
DATABASE_URL="mysql://root:password@localhost:3306/chef_registration"
ADMIN_SESSION_SECRET="replace-with-at-least-32-random-characters"
AWS_REGION="ap-southeast-2"
AWS_ACCESS_KEY_ID="your-access-key-id"
AWS_SECRET_ACCESS_KEY="your-secret-access-key"
S3_BUCKET_NAME="wpu-student-registration-2026"
S3_RECEIPT_PREFIX="CHEFS"
```

4. Apply the SQL migration:

```bash
npm run db:migrate
```

5. Start the app:

```bash
npm run dev
```

The registration API writes form data to the `registrations` SQL table. Uploaded receipts are saved in the private S3 prefix `CHEFS/`, and the database stores the S3 object key plus receipt metadata.

The S3 bucket should stay private. Give the app credentials only the permissions it needs for the receipt bucket:

```txt
s3:PutObject
s3:GetObject
```

## Admin portal

Open `/admin` to sign in.

Default admin account seeded by the migration:

```txt
Username: admin
Password: Admin@2026!
```

Change this password before using the app with real student data.

To change the password from the app:

1. Sign in at `/admin`.
2. Hover over the `admin` account button in the dashboard header.
3. Select `Change Password`.
4. You can also open `/admin/change-password` directly while signed in.
5. Enter the current password and the new password.

Only signed-in admins can access the change password page or API.
