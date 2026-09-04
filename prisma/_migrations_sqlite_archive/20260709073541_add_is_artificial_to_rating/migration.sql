-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Rating" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "movieId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "isArtificial" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Rating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Rating_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Rating" ("createdAt", "id", "movieId", "score", "updatedAt", "userId") SELECT "createdAt", "id", "movieId", "score", "updatedAt", "userId" FROM "Rating";
DROP TABLE "Rating";
ALTER TABLE "new_Rating" RENAME TO "Rating";
CREATE UNIQUE INDEX "Rating_userId_movieId_key" ON "Rating"("userId", "movieId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
