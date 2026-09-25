# SDD Progress - forged-wheels-cms-media

Branch: codex/unified-bizon-shop-foundation
Plan: docs/superpowers/plans/2026-07-27-forged-wheels-cms-media.md
Merge-base: 1bbda0388004505be43fa89b5b8e1aceac73e66f
Plan-head-before-impl: 901181aa31853b1fbb3974c432a49c2ac4ef32b4


Task 1: complete (commits 901181a..68f73b3, review clean)

Task 2: complete (commits 68f73b3..446cebb, review clean)

Task 3: complete (commits 446cebb..d36d293, review clean)

Task 4: complete (commits d36d293..34f47c4, review clean)

Task 5: complete (commits 34f47c4..00f8180, review clean)

Task 6: complete (commits 00f8180..c44b6e8, review clean)
  Minor deferred: cart itemId not manually exercised

ALL FORGED-WHEELS TASKS COMPLETE

# SDD Progress - frontend-cms-complete

Plan: docs/superpowers/plans/2026-09-25-frontend-cms-complete.md
Branch: frontend-cms

Task 1: complete (commit 683d09e, tests 20/20, controller accepted; full page UI deferred to Task 4)
Task 2: complete (commit f8c16eb, tsc exit 0)
Task 3: complete (commit aa3d8d4, tsc exit 0)
Task 4: complete (commit 9191b3b, tsc + 20 tests)
Polish: complete (commit c8c94aa, review gaps 1-16 and 18 fixed; nav and page id kept)

Final review: Important fixes in bf3b823 (forged type notFound + gallery readiness); re-review clean
Minor deferred: cart itemId manual smoke


# SDD Progress - local-sync-wave-1

Plan: docs/superpowers/plans/2026-09-25-local-sync-pipeline.md
Site branch: local-sync-wave-1
Site base: 0170ef84d256b7c33b75606c38eb5055266e4304
CMS branch: frontend-cms
Task 1: complete (commits 0170ef8..cbe83cb, review clean). Minor: test title mentions drafts; filtering belongs to Task 3. Plan kept the title verbatim.
Task 2: complete (commits cbe83cb..7e0dea2, review clean). Minor: whitespace-only home strings are kept.
Task 3: complete (commits 7e0dea2..a89e646, review clean). Minor: article list has no ORDER BY; test fixtures show mojibake.
Task 3: complete (commits 7e0dea2..a89e646, review clean). Minor: article list has no ORDER BY; test fixtures show mojibake.
Task 4: complete (commits a89e646..17c8bfe, review clean). Minor: type lookup filters in memory; unknown variant id returns []; README arrow mojibake. Concern noted: sortOrder may be a string from pg.
Task 5: complete (commits c8c94aa..063519f, review clean). Minor: column list is not the SQL builder; test imports pg Pool via the module. Read path still hardcodes brand empty string.
Task 6: complete (commits 17c8bfe..a85c06e, review clean). Live read check: backend :4000 returned tbr/otr, 3 TBR models, 13 articles, home CTA /selection. Site on :3010 showed /models/tbr with DSR188 and the model card. Port 3001 was already taken by the CMS Next process, so the site was checked on 3010. Minor deferred: no normalization unit tests; tire-iq topic filter unused; dev:clean still without port 3001; CMS mapTireModel still returns brand as empty string.
Wave 1 fixes: befe5c8 numeric strings from pg; 4e3d813 size_normalized fallback. Live: dsr188 variants show 12.00R20 on API and on http://127.0.0.1:3010/models/tbr/dsr188.
Site branch local-sync-wave-1 head 4e3d813. CMS commit 063519f on frontend-cms. Not pushed.
Wave 2: gallery and advantages read/write, home and stub hero images, wheel variants and gallery, shop variants and HTML description, marketing pages overlay published CMS fields and keep code fallbacks when the page is draft. Payload /api/media/file URLs are rewritten to /media so the site can serve local files. Live: Atlas gallery loads, DSR188 shows 12.00R20 and advantages without raw HTML tags, about stays on the code copy while unpublished. Shop catalog is empty because no products are published. Site commit 018db27 on local-sync-wave-1. Not pushed.
