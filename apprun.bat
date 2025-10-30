@echo off
echo Cleaning default Next.js files...
:: Remove default pages and styles
del /F /Q "app\page.tsx"
del /F /Q "app\layout.tsx"
del /F /Q "app\globals.css"
del /F /Q "public\next.svg"
del /F /Q "public\vercel.svg"

echo Creating project structure from architecture-info.md...

:: 1. Create (app) group directories
mkdir "app\(app)\dashboard"
mkdir "app\(app)\companies\[id]"
mkdir "app\(app)\people"
mkdir "app\(app)\deals"
mkdir "app\(app)\sequences"

:: 2. Create (auth) group directories
mkdir "app\(auth)\sign-in\[[...sign-in]]"
mkdir "app\(auth)\sign-up\[[...sign-up]]"

:: 3. Create api directory
mkdir "app\api\clerk"

:: 4. Create lib and prisma directories
mkdir "lib\actions"
mkdir "prisma"

:: 5. Create empty files (placeholders to be filled)
type NUL > app\globals.css
type NUL > app\layout.tsx
type NUL > app\page.tsx
type NUL > "app\(app)\layout.tsx"
type NUL > "app\(app)\dashboard\page.tsx"
type NUL > "app\(app)\companies\page.tsx"
type NUL > "app\(app)\companies\[id]\page.tsx"
type NUL > "app\(app)\people\page.tsx"
type NUL > "app\(app)\deals\page.tsx"
type NUL > "app\(app)\sequences\page.tsx"
type NUL > "app\(auth)\sign-in\[[...sign-in]]\page.tsx"
type NUL > "app\(auth)\sign-up\[[...sign-up]]\page.tsx"
type NUL > "app\api\clerk\webhook.ts"
type NUL > middleware.ts
type NUL > lib\db.ts
type NUL > lib\providers.tsx
type NUL > lib\actions\crm.actions.ts
type NUL > lib\actions\ai.actions.ts
type NUL > prisma\schema.prisma
type NUL > .env.local
type NUL > .gitignore

:: Add node_modules to .gitignore
echo node_modules > .gitignore
echo .env.local >> .gitignore

echo Project structure created successfully!
echo Next steps:
echo 1. Copy the code from our chat into the new empty files.
echo 2. Run "npm install".
echo 3. Fill out your .env.local file.
echo 4. Run "npx prisma db push".
