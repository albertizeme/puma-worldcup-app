


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."generate_ranking_snapshot"("p_snapshot_key" "text", "p_snapshot_label" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
begin
  insert into public.ranking_snapshots (
    snapshot_key,
    snapshot_label,
    user_id,
    display_name,
    position,
    total_points,
    exact_hits,
    tendency_hits
  )
  with ranked as (
    select
      p_snapshot_key as snapshot_key,
      p_snapshot_label as snapshot_label,
      r.user_id,
      coalesce(p.display_name, p.email, 'Usuario') as display_name,
      row_number() over (
        order by
          coalesce(r.total_points, 0) desc,
          coalesce(r.exact_hits, 0) desc,
          coalesce(r.tendency_hits, 0) desc,
          coalesce(p.display_name, p.email, 'Usuario') asc
      ) as position,
      coalesce(r.total_points, 0) as total_points,
      coalesce(r.exact_hits, 0) as exact_hits,
      coalesce(r.tendency_hits, 0) as tendency_hits
    from public.ranking r
    left join public.profiles p
      on p.id = r.user_id
  )
  select
    snapshot_key,
    snapshot_label,
    user_id,
    display_name,
    position,
    total_points,
    exact_hits,
    tendency_hits
  from ranked
  on conflict (snapshot_key, user_id)
  do update set
    snapshot_label = excluded.snapshot_label,
    display_name = excluded.display_name,
    position = excluded.position,
    total_points = excluded.total_points,
    exact_hits = excluded.exact_hits,
    tendency_hits = excluded.tendency_hits,
    created_at = now();
end;
$$;


ALTER FUNCTION "public"."generate_ranking_snapshot"("p_snapshot_key" "text", "p_snapshot_label" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_auth_user_sync"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  insert into public.users (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      split_part(new.email, '@', 1),
      'Usuario'
    )
  )
  on conflict (id) do update
  set
    email = excluded.email,
    display_name = coalesce(excluded.display_name, public.users.display_name, 'Usuario');

  return new;
end;
$$;


ALTER FUNCTION "public"."handle_auth_user_sync"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  insert into public.profiles (
    id,
    email,
    display_name,
    role,
    is_active,
    must_change_password,
    created_at,
    updated_at
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    'user',
    true,
    true,
    now(),
    now()
  )
  on conflict (id) do nothing;

  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_prediction_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  update public.profiles
  set
    last_prediction_at = now(),
    updated_at = now()
  where id = new.user_id;

  return new;
end;
$$;


ALTER FUNCTION "public"."handle_prediction_activity"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin_user"() RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and is_active = true
  );
$$;


ALTER FUNCTION "public"."is_admin_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."admin_audit_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "admin_user_id" "uuid" NOT NULL,
    "target_user_id" "uuid" NOT NULL,
    "action" "text" NOT NULL,
    "details" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."admin_audit_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_settings" (
    "key" "text" NOT NULL,
    "value" "text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."app_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."champion_predictions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "predicted_team_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."champion_predictions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fake_leaderboard" (
    "user_name" "text",
    "total_points" integer,
    "exact_hits" integer,
    "tendency_hits" integer
);


ALTER TABLE "public"."fake_leaderboard" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."matches" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "stage" "text",
    "match_datetime" timestamp with time zone,
    "home_team" "text",
    "away_team" "text",
    "is_puma_match" boolean DEFAULT false,
    "match_time" "text",
    "home_flag" "text",
    "away_flag" "text",
    "home_score" integer,
    "away_score" integer,
    "status" "text" DEFAULT 'upcoming'::"text" NOT NULL,
    "match_number" integer,
    "is_prediction_open" boolean DEFAULT true NOT NULL,
    "is_visible" boolean DEFAULT true NOT NULL,
    CONSTRAINT "matches_status_check" CHECK (("status" = ANY (ARRAY['upcoming'::"text", 'live'::"text", 'finished'::"text"])))
);


ALTER TABLE "public"."matches" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."predictions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "match_id" "uuid" NOT NULL,
    "home_score_pred" integer NOT NULL,
    "away_score_pred" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "predictions_away_score_pred_check" CHECK (("away_score_pred" >= 0)),
    CONSTRAINT "predictions_home_score_pred_check" CHECK (("home_score_pred" >= 0))
);


ALTER TABLE "public"."predictions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."teams" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "is_puma_team" boolean DEFAULT false,
    "sponsor_brand" "text",
    "sponsor_campaign_image" "text",
    "sponsor_kit_image" "text",
    "sponsor_card_text" "text",
    "sponsor_card_title" "text",
    "flag_code" "text"
);


ALTER TABLE "public"."teams" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."prediction_scores_old" AS
 SELECT "p"."id" AS "prediction_id",
    "p"."user_id",
    "p"."match_id",
    "p"."home_score_pred",
    "p"."away_score_pred",
    "m"."home_score",
    "m"."away_score",
        CASE
            WHEN (("m"."home_score" IS NULL) OR ("m"."away_score" IS NULL)) THEN NULL::integer
            WHEN (("p"."home_score_pred" = "m"."home_score") AND ("p"."away_score_pred" = "m"."away_score")) THEN (3 +
            CASE
                WHEN (COALESCE("home_team"."is_puma_team", false) OR COALESCE("away_team"."is_puma_team", false)) THEN 1
                ELSE 0
            END)
            WHEN ((("p"."home_score_pred" > "p"."away_score_pred") AND ("m"."home_score" > "m"."away_score")) OR (("p"."home_score_pred" < "p"."away_score_pred") AND ("m"."home_score" < "m"."away_score")) OR (("p"."home_score_pred" = "p"."away_score_pred") AND ("m"."home_score" = "m"."away_score"))) THEN (1 +
            CASE
                WHEN (COALESCE("home_team"."is_puma_team", false) OR COALESCE("away_team"."is_puma_team", false)) THEN 1
                ELSE 0
            END)
            ELSE 0
        END AS "points",
        CASE
            WHEN (("m"."home_score" IS NULL) OR ("m"."away_score" IS NULL)) THEN false
            WHEN (("p"."home_score_pred" = "m"."home_score") AND ("p"."away_score_pred" = "m"."away_score")) THEN true
            ELSE false
        END AS "exact_hit"
   FROM ((("public"."predictions" "p"
     JOIN "public"."matches" "m" ON (("m"."id" = "p"."match_id")))
     LEFT JOIN "public"."teams" "home_team" ON (("lower"(TRIM(BOTH FROM "home_team"."name")) = "lower"(TRIM(BOTH FROM "m"."home_team")))))
     LEFT JOIN "public"."teams" "away_team" ON (("lower"(TRIM(BOTH FROM "away_team"."name")) = "lower"(TRIM(BOTH FROM "m"."away_team")))));


ALTER VIEW "public"."prediction_scores_old" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "display_name" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "is_admin" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."prediction_scores" AS
 WITH "champion_settings" AS (
         SELECT ("max"(
                CASE
                    WHEN ("app_settings"."key" = 'world_cup_winner_team_id'::"text") THEN "app_settings"."value"
                    ELSE NULL::"text"
                END))::"uuid" AS "winner_team_id",
            COALESCE(("max"(
                CASE
                    WHEN ("app_settings"."key" = 'champion_prediction_bonus_points'::"text") THEN "app_settings"."value"
                    ELSE NULL::"text"
                END))::integer, 20) AS "bonus_points"
           FROM "public"."app_settings"
        ), "base_scores" AS (
         SELECT "ps"."user_id",
            COALESCE("u"."display_name", "u"."email", 'Usuario'::"text") AS "display_name",
            COALESCE("sum"("ps"."points"), (0)::bigint) AS "base_points",
            COALESCE("sum"(
                CASE
                    WHEN "ps"."exact_hit" THEN 1
                    ELSE 0
                END), (0)::bigint) AS "exact_hits",
            COALESCE("sum"(
                CASE
                    WHEN (("ps"."points" IS NOT NULL) AND ("ps"."points" > 0) AND (NOT "ps"."exact_hit")) THEN 1
                    ELSE 0
                END), (0)::bigint) AS "tendency_hits",
            COALESCE("sum"(
                CASE
                    WHEN ("ps"."points" IS NOT NULL) THEN 1
                    ELSE 0
                END), (0)::bigint) AS "resolved_predictions"
           FROM ("public"."prediction_scores_old" "ps"
             LEFT JOIN "public"."users" "u" ON (("u"."id" = "ps"."user_id")))
          GROUP BY "ps"."user_id", COALESCE("u"."display_name", "u"."email", 'Usuario'::"text")
        ), "champion_bonus" AS (
         SELECT "cp"."user_id",
                CASE
                    WHEN (("cs"."winner_team_id" IS NOT NULL) AND ("cp"."predicted_team_id" = "cs"."winner_team_id")) THEN "cs"."bonus_points"
                    ELSE 0
                END AS "champion_bonus_points"
           FROM ("public"."champion_predictions" "cp"
             CROSS JOIN "champion_settings" "cs")
        )
 SELECT "bs"."user_id",
    "bs"."display_name",
    ("bs"."base_points" + COALESCE("cb"."champion_bonus_points", 0)) AS "total_points",
    "bs"."exact_hits",
    "bs"."tendency_hits",
    "bs"."resolved_predictions",
    COALESCE("cb"."champion_bonus_points", 0) AS "champion_bonus_points"
   FROM ("base_scores" "bs"
     LEFT JOIN "champion_bonus" "cb" ON (("cb"."user_id" = "bs"."user_id")));


ALTER VIEW "public"."prediction_scores" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."leaderboard_view" WITH ("security_invoker"='false') AS
 SELECT "user_id",
    "display_name",
    "total_points",
    "exact_hits",
    "tendency_hits",
    "resolved_predictions"
   FROM "public"."prediction_scores" "ps"
  ORDER BY "total_points" DESC, "exact_hits" DESC, "tendency_hits" DESC, "display_name";


ALTER VIEW "public"."leaderboard_view" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."my_predictions_view" AS
 SELECT "p"."id" AS "prediction_id",
    "p"."user_id",
    "p"."match_id",
    "p"."home_score_pred",
    "p"."away_score_pred",
    "p"."created_at",
    "m"."stage",
    "m"."match_datetime",
    "m"."home_team",
    "m"."away_team",
    (COALESCE("home_team"."is_puma_team", false) OR COALESCE("away_team"."is_puma_team", false)) AS "is_puma_match",
    "m"."home_flag",
    "m"."away_flag",
    "m"."home_score",
    "m"."away_score",
    "ps"."points",
    "ps"."exact_hit"
   FROM (((("public"."predictions" "p"
     JOIN "public"."matches" "m" ON (("m"."id" = "p"."match_id")))
     LEFT JOIN "public"."prediction_scores_old" "ps" ON (("ps"."prediction_id" = "p"."id")))
     LEFT JOIN "public"."teams" "home_team" ON (("lower"(TRIM(BOTH FROM "home_team"."name")) = "lower"(TRIM(BOTH FROM "m"."home_team")))))
     LEFT JOIN "public"."teams" "away_team" ON (("lower"(TRIM(BOTH FROM "away_team"."name")) = "lower"(TRIM(BOTH FROM "m"."away_team")))));


ALTER VIEW "public"."my_predictions_view" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."prediction_kpi_ranking" AS
 WITH "finished_matches" AS (
         SELECT "m"."id",
            "m"."home_score",
            "m"."away_score",
            COALESCE("m"."is_puma_match", false) AS "is_puma_match"
           FROM "public"."matches" "m"
          WHERE (("m"."status" = 'finished'::"text") AND ("m"."home_score" IS NOT NULL) AND ("m"."away_score" IS NOT NULL))
        ), "prediction_points" AS (
         SELECT "p"."user_id",
            "p"."match_id",
                CASE
                    WHEN (("p"."home_score_pred" = "fm"."home_score") AND ("p"."away_score_pred" = "fm"."away_score")) THEN (3 +
                    CASE
                        WHEN "fm"."is_puma_match" THEN 1
                        ELSE 0
                    END)
                    WHEN ((("p"."home_score_pred" > "p"."away_score_pred") AND ("fm"."home_score" > "fm"."away_score")) OR (("p"."home_score_pred" < "p"."away_score_pred") AND ("fm"."home_score" < "fm"."away_score")) OR (("p"."home_score_pred" = "p"."away_score_pred") AND ("fm"."home_score" = "fm"."away_score"))) THEN (1 +
                    CASE
                        WHEN "fm"."is_puma_match" THEN 1
                        ELSE 0
                    END)
                    ELSE 0
                END AS "points"
           FROM ("public"."predictions" "p"
             JOIN "finished_matches" "fm" ON (("fm"."id" = "p"."match_id")))
        ), "user_stats" AS (
         SELECT "pp"."user_id",
            "count"(*) AS "total_predictions",
            "sum"("pp"."points") AS "total_points",
            "sum"(
                CASE
                    WHEN ("pp"."points" > 0) THEN 1
                    ELSE 0
                END) AS "successful_predictions"
           FROM "prediction_points" "pp"
          GROUP BY "pp"."user_id"
        ), "match_stats" AS (
         SELECT "count"(*) AS "total_finished_matches"
           FROM "finished_matches"
        )
 SELECT "us"."user_id",
    "us"."total_predictions",
    "us"."total_points",
    "us"."successful_predictions",
    "round"((("us"."total_points")::numeric / (NULLIF("us"."total_predictions", 0))::numeric), 2) AS "points_per_prediction",
    "round"((("us"."total_predictions")::numeric / (NULLIF("ms"."total_finished_matches", 0))::numeric), 4) AS "participation_ratio",
    "round"(((("us"."successful_predictions")::numeric / (NULLIF("us"."total_predictions", 0))::numeric) * (100)::numeric), 2) AS "success_rate_pct",
    "round"(((("us"."total_points")::numeric / (NULLIF("us"."total_predictions", 0))::numeric) * (("us"."total_predictions")::numeric / (NULLIF("ms"."total_finished_matches", 0))::numeric)), 4) AS "combined_score"
   FROM ("user_stats" "us"
     CROSS JOIN "match_stats" "ms");


ALTER VIEW "public"."prediction_kpi_ranking" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "display_name" "text",
    "role" "text" DEFAULT 'user'::"text" NOT NULL,
    "must_change_password" boolean DEFAULT true NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "last_password_reset_at" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_seen_at" timestamp with time zone,
    "last_prediction_at" timestamp with time zone,
    CONSTRAINT "profiles_role_check" CHECK (("role" = ANY (ARRAY['user'::"text", 'admin'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."prediction_kpi_ranking_full" AS
 WITH "finished_matches" AS (
         SELECT "m"."id",
            "m"."home_score",
            "m"."away_score",
            COALESCE("m"."is_puma_match", false) AS "is_puma_match"
           FROM "public"."matches" "m"
          WHERE (("m"."status" = 'finished'::"text") AND ("m"."home_score" IS NOT NULL) AND ("m"."away_score" IS NOT NULL))
        ), "prediction_points" AS (
         SELECT "p"."user_id",
            "p"."match_id",
                CASE
                    WHEN (("p"."home_score_pred" = "fm"."home_score") AND ("p"."away_score_pred" = "fm"."away_score")) THEN (3 +
                    CASE
                        WHEN "fm"."is_puma_match" THEN 1
                        ELSE 0
                    END)
                    WHEN ((("p"."home_score_pred" > "p"."away_score_pred") AND ("fm"."home_score" > "fm"."away_score")) OR (("p"."home_score_pred" < "p"."away_score_pred") AND ("fm"."home_score" < "fm"."away_score")) OR (("p"."home_score_pred" = "p"."away_score_pred") AND ("fm"."home_score" = "fm"."away_score"))) THEN (1 +
                    CASE
                        WHEN "fm"."is_puma_match" THEN 1
                        ELSE 0
                    END)
                    ELSE 0
                END AS "points",
                CASE
                    WHEN ("fm"."is_puma_match" AND ((("p"."home_score_pred" = "fm"."home_score") AND ("p"."away_score_pred" = "fm"."away_score")) OR ((("p"."home_score_pred" > "p"."away_score_pred") AND ("fm"."home_score" > "fm"."away_score")) OR (("p"."home_score_pred" < "p"."away_score_pred") AND ("fm"."home_score" < "fm"."away_score")) OR (("p"."home_score_pred" = "p"."away_score_pred") AND ("fm"."home_score" = "fm"."away_score"))))) THEN 1
                    ELSE 0
                END AS "puma_bonus_point"
           FROM ("public"."predictions" "p"
             JOIN "finished_matches" "fm" ON (("fm"."id" = "p"."match_id")))
        ), "user_stats" AS (
         SELECT "pp"."user_id",
            "count"(*) AS "total_predictions",
            "sum"("pp"."points") AS "total_points",
            "sum"(
                CASE
                    WHEN ("pp"."points" > 0) THEN 1
                    ELSE 0
                END) AS "successful_predictions",
            "sum"("pp"."puma_bonus_point") AS "puma_bonus_points"
           FROM "prediction_points" "pp"
          GROUP BY "pp"."user_id"
        ), "match_stats" AS (
         SELECT "count"(*) AS "total_finished_matches"
           FROM "finished_matches"
        )
 SELECT "pr"."id" AS "user_id",
    "pr"."email",
    "pr"."display_name",
    "pr"."role",
    "pr"."is_active",
    "pr"."created_at",
    "pr"."last_seen_at",
    "pr"."last_prediction_at",
    "us"."total_predictions",
    "us"."total_points",
    "us"."successful_predictions",
    "us"."puma_bonus_points",
    "round"((("us"."total_points")::numeric / (NULLIF("us"."total_predictions", 0))::numeric), 2) AS "points_per_prediction",
    "round"((("us"."total_predictions")::numeric / (NULLIF("ms"."total_finished_matches", 0))::numeric), 4) AS "participation_ratio",
    "round"(((("us"."successful_predictions")::numeric / (NULLIF("us"."total_predictions", 0))::numeric) * (100)::numeric), 2) AS "success_rate_pct",
    "round"(((("us"."total_points")::numeric / (NULLIF("us"."total_predictions", 0))::numeric) * (("us"."total_predictions")::numeric / (NULLIF("ms"."total_finished_matches", 0))::numeric)), 4) AS "combined_score"
   FROM (("user_stats" "us"
     CROSS JOIN "match_stats" "ms")
     JOIN "public"."profiles" "pr" ON (("pr"."id" = "us"."user_id")))
  WHERE ("pr"."is_active" = true)
  ORDER BY ("round"(((("us"."total_points")::numeric / (NULLIF("us"."total_predictions", 0))::numeric) * (("us"."total_predictions")::numeric / (NULLIF("ms"."total_finished_matches", 0))::numeric)), 4)) DESC, "us"."total_points" DESC, ("round"(((("us"."successful_predictions")::numeric / (NULLIF("us"."total_predictions", 0))::numeric) * (100)::numeric), 2)) DESC, "us"."total_predictions" DESC, "pr"."display_name", "pr"."email";


ALTER VIEW "public"."prediction_kpi_ranking_full" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."prediction_scores_v2" AS
 SELECT "p"."user_id",
    "u"."display_name",
    "sum"(
        CASE
            WHEN (("p"."home_score_pred" = "m"."home_score") AND ("p"."away_score_pred" = "m"."away_score")) THEN 3
            WHEN ((("p"."home_score_pred" > "p"."away_score_pred") AND ("m"."home_score" > "m"."away_score")) OR (("p"."home_score_pred" < "p"."away_score_pred") AND ("m"."home_score" < "m"."away_score")) OR (("p"."home_score_pred" = "p"."away_score_pred") AND ("m"."home_score" = "m"."away_score"))) THEN 1
            ELSE 0
        END) AS "total_points",
    "sum"(
        CASE
            WHEN (("p"."home_score_pred" = "m"."home_score") AND ("p"."away_score_pred" = "m"."away_score")) THEN 1
            ELSE 0
        END) AS "exact_hits",
    "sum"(
        CASE
            WHEN (((("p"."home_score_pred" > "p"."away_score_pred") AND ("m"."home_score" > "m"."away_score")) OR (("p"."home_score_pred" < "p"."away_score_pred") AND ("m"."home_score" < "m"."away_score")) OR (("p"."home_score_pred" = "p"."away_score_pred") AND ("m"."home_score" = "m"."away_score"))) AND (NOT (("p"."home_score_pred" = "m"."home_score") AND ("p"."away_score_pred" = "m"."away_score")))) THEN 1
            ELSE 0
        END) AS "tendency_hits"
   FROM (("public"."predictions" "p"
     JOIN "public"."matches" "m" ON (("p"."match_id" = "m"."id")))
     JOIN "public"."users" "u" ON (("p"."user_id" = "u"."id")))
  WHERE (("m"."home_score" IS NOT NULL) AND ("m"."away_score" IS NOT NULL))
  GROUP BY "p"."user_id", "u"."display_name";


ALTER VIEW "public"."prediction_scores_v2" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."ranking" WITH ("security_invoker"='false') AS
 SELECT "user_id",
    "total_points",
    "resolved_predictions" AS "scored_predictions",
    "exact_hits",
    "tendency_hits"
   FROM "public"."prediction_scores" "ps"
  ORDER BY "total_points" DESC, "exact_hits" DESC, "tendency_hits" DESC, "display_name";


ALTER VIEW "public"."ranking" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ranking_snapshots" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "snapshot_key" "text" NOT NULL,
    "snapshot_label" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "display_name" "text",
    "position" integer NOT NULL,
    "total_points" integer DEFAULT 0 NOT NULL,
    "exact_hits" integer DEFAULT 0 NOT NULL,
    "tendency_hits" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."ranking_snapshots" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."ranking_view" WITH ("security_invoker"='false') AS
 SELECT "r"."user_id",
    COALESCE("u"."display_name", "u"."email", 'Usuario'::"text") AS "display_name",
    "u"."email",
    "r"."total_points",
    "r"."scored_predictions",
    "r"."exact_hits",
    "r"."tendency_hits"
   FROM ("public"."ranking" "r"
     LEFT JOIN "public"."users" "u" ON (("u"."id" = "r"."user_id")))
  ORDER BY "r"."total_points" DESC, "r"."exact_hits" DESC, "r"."tendency_hits" DESC, COALESCE("u"."display_name", "u"."email", 'Usuario'::"text");


ALTER VIEW "public"."ranking_view" OWNER TO "postgres";


ALTER TABLE ONLY "public"."admin_audit_logs"
    ADD CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_settings"
    ADD CONSTRAINT "app_settings_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."champion_predictions"
    ADD CONSTRAINT "champion_predictions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."predictions"
    ADD CONSTRAINT "predictions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."predictions"
    ADD CONSTRAINT "predictions_user_id_match_id_key" UNIQUE ("user_id", "match_id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ranking_snapshots"
    ADD CONSTRAINT "ranking_snapshots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ranking_snapshots"
    ADD CONSTRAINT "ranking_snapshots_unique" UNIQUE ("snapshot_key", "user_id");



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE UNIQUE INDEX "champion_predictions_user_id_key" ON "public"."champion_predictions" USING "btree" ("user_id");



CREATE INDEX "idx_predictions_match_id" ON "public"."predictions" USING "btree" ("match_id");



CREATE INDEX "idx_predictions_user_id" ON "public"."predictions" USING "btree" ("user_id");



CREATE INDEX "idx_predictions_user_match" ON "public"."predictions" USING "btree" ("user_id", "match_id");



CREATE UNIQUE INDEX "profiles_email_unique_idx" ON "public"."profiles" USING "btree" ("lower"("email"));



CREATE INDEX "ranking_snapshots_created_at_idx" ON "public"."ranking_snapshots" USING "btree" ("created_at" DESC);



CREATE INDEX "ranking_snapshots_snapshot_key_idx" ON "public"."ranking_snapshots" USING "btree" ("snapshot_key");



CREATE INDEX "ranking_snapshots_user_id_idx" ON "public"."ranking_snapshots" USING "btree" ("user_id");



CREATE UNIQUE INDEX "teams_name_unique_idx" ON "public"."teams" USING "btree" ("name");



CREATE OR REPLACE TRIGGER "on_prediction_activity" AFTER INSERT OR UPDATE ON "public"."predictions" FOR EACH ROW EXECUTE FUNCTION "public"."handle_prediction_activity"();



CREATE OR REPLACE TRIGGER "trg_app_settings_updated_at" BEFORE UPDATE ON "public"."app_settings" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_champion_predictions_updated_at" BEFORE UPDATE ON "public"."champion_predictions" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_predictions_updated_at" BEFORE UPDATE ON "public"."predictions" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



ALTER TABLE ONLY "public"."champion_predictions"
    ADD CONSTRAINT "champion_predictions_predicted_team_id_fkey" FOREIGN KEY ("predicted_team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."champion_predictions"
    ADD CONSTRAINT "champion_predictions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."predictions"
    ADD CONSTRAINT "predictions_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."predictions"
    ADD CONSTRAINT "predictions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Allow read predictions" ON "public"."predictions" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow read ranking snapshots to authenticated users" ON "public"."ranking_snapshots" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Users can delete own predictions" ON "public"."predictions" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own champion prediction" ON "public"."champion_predictions" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can insert own predictions" ON "public"."predictions" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own champions" ON "public"."champion_predictions" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own predictions" ON "public"."predictions" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read own champion prediction" ON "public"."champion_predictions" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update own champion prediction" ON "public"."champion_predictions" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update own predictions" ON "public"."predictions" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own champions" ON "public"."champion_predictions" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own predictions" ON "public"."predictions" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own predictions" ON "public"."predictions" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."admin_audit_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "admin_audit_logs_insert_service_role" ON "public"."admin_audit_logs" FOR INSERT TO "authenticated" WITH CHECK (false);



CREATE POLICY "admin_audit_logs_select_authenticated" ON "public"."admin_audit_logs" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."app_settings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "app_settings_select_authenticated" ON "public"."app_settings" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."champion_predictions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "champion_predictions_delete_self" ON "public"."champion_predictions" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "champion_predictions_insert_self" ON "public"."champion_predictions" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "champion_predictions_select_self" ON "public"."champion_predictions" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "champion_predictions_update_self" ON "public"."champion_predictions" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."fake_leaderboard" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."matches" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "matches_select_authenticated" ON "public"."matches" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."predictions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "predictions_delete_self" ON "public"."predictions" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "predictions_insert_self" ON "public"."predictions" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "predictions_select_self" ON "public"."predictions" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "predictions_update_self" ON "public"."predictions" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_admin_can_select_all" ON "public"."profiles" FOR SELECT TO "authenticated" USING (( SELECT "public"."is_admin_user"() AS "is_admin_user"));



CREATE POLICY "profiles_select_self" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("id" = "auth"."uid"()));



CREATE POLICY "profiles_update_self" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("id" = "auth"."uid"())) WITH CHECK (("id" = "auth"."uid"()));



CREATE POLICY "profiles_user_can_select_own" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "id"));



CREATE POLICY "profiles_user_can_update_own" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



ALTER TABLE "public"."ranking_snapshots" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ranking_snapshots_select_authenticated" ON "public"."ranking_snapshots" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."teams" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "teams_select_authenticated" ON "public"."teams" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users_select_authenticated" ON "public"."users" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "users_update_own" ON "public"."users" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."generate_ranking_snapshot"("p_snapshot_key" "text", "p_snapshot_label" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_ranking_snapshot"("p_snapshot_key" "text", "p_snapshot_label" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_ranking_snapshot"("p_snapshot_key" "text", "p_snapshot_label" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_auth_user_sync"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_auth_user_sync"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_auth_user_sync"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_prediction_activity"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_prediction_activity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_prediction_activity"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";


















GRANT ALL ON TABLE "public"."admin_audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."admin_audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_audit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."app_settings" TO "anon";
GRANT ALL ON TABLE "public"."app_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."app_settings" TO "service_role";



GRANT ALL ON TABLE "public"."champion_predictions" TO "anon";
GRANT ALL ON TABLE "public"."champion_predictions" TO "authenticated";
GRANT ALL ON TABLE "public"."champion_predictions" TO "service_role";



GRANT ALL ON TABLE "public"."fake_leaderboard" TO "anon";
GRANT ALL ON TABLE "public"."fake_leaderboard" TO "authenticated";
GRANT ALL ON TABLE "public"."fake_leaderboard" TO "service_role";



GRANT ALL ON TABLE "public"."matches" TO "anon";
GRANT ALL ON TABLE "public"."matches" TO "authenticated";
GRANT ALL ON TABLE "public"."matches" TO "service_role";



GRANT ALL ON TABLE "public"."predictions" TO "anon";
GRANT ALL ON TABLE "public"."predictions" TO "authenticated";
GRANT ALL ON TABLE "public"."predictions" TO "service_role";



GRANT ALL ON TABLE "public"."teams" TO "anon";
GRANT ALL ON TABLE "public"."teams" TO "authenticated";
GRANT ALL ON TABLE "public"."teams" TO "service_role";



GRANT ALL ON TABLE "public"."prediction_scores_old" TO "anon";
GRANT ALL ON TABLE "public"."prediction_scores_old" TO "authenticated";
GRANT ALL ON TABLE "public"."prediction_scores_old" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."prediction_scores" TO "anon";
GRANT ALL ON TABLE "public"."prediction_scores" TO "authenticated";
GRANT ALL ON TABLE "public"."prediction_scores" TO "service_role";



GRANT ALL ON TABLE "public"."leaderboard_view" TO "anon";
GRANT ALL ON TABLE "public"."leaderboard_view" TO "authenticated";
GRANT ALL ON TABLE "public"."leaderboard_view" TO "service_role";



GRANT ALL ON TABLE "public"."my_predictions_view" TO "anon";
GRANT ALL ON TABLE "public"."my_predictions_view" TO "authenticated";
GRANT ALL ON TABLE "public"."my_predictions_view" TO "service_role";



GRANT ALL ON TABLE "public"."prediction_kpi_ranking" TO "anon";
GRANT ALL ON TABLE "public"."prediction_kpi_ranking" TO "authenticated";
GRANT ALL ON TABLE "public"."prediction_kpi_ranking" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."prediction_kpi_ranking_full" TO "anon";
GRANT ALL ON TABLE "public"."prediction_kpi_ranking_full" TO "authenticated";
GRANT ALL ON TABLE "public"."prediction_kpi_ranking_full" TO "service_role";



GRANT ALL ON TABLE "public"."prediction_scores_v2" TO "anon";
GRANT ALL ON TABLE "public"."prediction_scores_v2" TO "authenticated";
GRANT ALL ON TABLE "public"."prediction_scores_v2" TO "service_role";



GRANT ALL ON TABLE "public"."ranking" TO "anon";
GRANT ALL ON TABLE "public"."ranking" TO "authenticated";
GRANT ALL ON TABLE "public"."ranking" TO "service_role";



GRANT ALL ON TABLE "public"."ranking_snapshots" TO "anon";
GRANT ALL ON TABLE "public"."ranking_snapshots" TO "authenticated";
GRANT ALL ON TABLE "public"."ranking_snapshots" TO "service_role";



GRANT ALL ON TABLE "public"."ranking_view" TO "anon";
GRANT ALL ON TABLE "public"."ranking_view" TO "authenticated";
GRANT ALL ON TABLE "public"."ranking_view" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop extension if exists "pg_net";

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_auth_user_updated AFTER UPDATE OF email, raw_user_meta_data ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_sync();


