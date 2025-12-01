--
-- PostgreSQL database dump
--

\c intake24_system;

-- Dumped from database version 17.7
-- Dumped by pg_dump version 17.6 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: sex_enum; Type: TYPE; Schema: public; Owner: intake24
--

CREATE TYPE public.sex_enum AS ENUM (
    'f',
    'm'
);


ALTER TYPE public.sex_enum OWNER TO intake24;

--
-- Name: weight_target_enum; Type: TYPE; Schema: public; Owner: intake24
--

CREATE TYPE public.weight_target_enum AS ENUM (
    'keep_weight',
    'lose_weight',
    'gain_weight'
);


ALTER TYPE public.weight_target_enum OWNER TO intake24;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: client_error_reports; Type: TABLE; Schema: public; Owner: intake24
--

CREATE TABLE public.client_error_reports (
    id bigint NOT NULL,
    user_id bigint,
    survey_id bigint,
    stack_trace text NOT NULL,
    survey_state_json text NOT NULL,
    new boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.client_error_reports OWNER TO intake24;

--
-- Name: client_error_reports_id_seq; Type: SEQUENCE; Schema: public; Owner: intake24
--

CREATE SEQUENCE public.client_error_reports_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.client_error_reports_id_seq OWNER TO intake24;

--
-- Name: client_error_reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: intake24
--

ALTER SEQUENCE public.client_error_reports_id_seq OWNED BY public.client_error_reports.id;


--
-- Name: external_test_users; Type: TABLE; Schema: public; Owner: intake24
--

CREATE TABLE public.external_test_users (
    id integer NOT NULL,
    user_id bigint NOT NULL,
    external_user_id character varying(512) NOT NULL,
    confirmation_code character varying(32) NOT NULL
);


ALTER TABLE public.external_test_users OWNER TO intake24;

--
-- Name: external_test_users_id_seq; Type: SEQUENCE; Schema: public; Owner: intake24
--

CREATE SEQUENCE public.external_test_users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.external_test_users_id_seq OWNER TO intake24;

--
-- Name: external_test_users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: intake24
--

ALTER SEQUENCE public.external_test_users_id_seq OWNED BY public.external_test_users.id;


--
-- Name: faqs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.faqs (
    id bigint NOT NULL,
    name character varying(256) NOT NULL,
    content text NOT NULL,
    owner_id bigint,
    visibility character varying(32) DEFAULT 'public'::character varying NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.faqs OWNER TO postgres;

--
-- Name: faqs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.faqs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.faqs_id_seq OWNER TO postgres;

--
-- Name: faqs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.faqs_id_seq OWNED BY public.faqs.id;


--
-- Name: feedback_schemes; Type: TABLE; Schema: public; Owner: intake24
--

CREATE TABLE public.feedback_schemes (
    id bigint NOT NULL,
    name character varying(256) NOT NULL,
    type character varying(64) NOT NULL,
    top_foods text NOT NULL,
    cards text NOT NULL,
    henry_coefficients text NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    demographic_groups text NOT NULL,
    owner_id bigint,
    outputs text,
    physical_data_fields text,
    sections text NOT NULL,
    meals text NOT NULL,
    visibility character varying(32) DEFAULT 'public'::character varying NOT NULL
);


ALTER TABLE public.feedback_schemes OWNER TO intake24;

--
-- Name: feedback_schemes_id_seq; Type: SEQUENCE; Schema: public; Owner: intake24
--

CREATE SEQUENCE public.feedback_schemes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.feedback_schemes_id_seq OWNER TO intake24;

--
-- Name: feedback_schemes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: intake24
--

ALTER SEQUENCE public.feedback_schemes_id_seq OWNED BY public.feedback_schemes.id;


--
-- Name: fixed_food_ranking; Type: TABLE; Schema: public; Owner: intake24
--

CREATE TABLE public.fixed_food_ranking (
    id integer NOT NULL,
    locale_id character varying(64) NOT NULL,
    food_code character varying(64) NOT NULL,
    rank integer NOT NULL
);


ALTER TABLE public.fixed_food_ranking OWNER TO intake24;

--
-- Name: fixed_food_ranking_id_seq; Type: SEQUENCE; Schema: public; Owner: intake24
--

CREATE SEQUENCE public.fixed_food_ranking_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.fixed_food_ranking_id_seq OWNER TO intake24;

--
-- Name: fixed_food_ranking_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: intake24
--

ALTER SEQUENCE public.fixed_food_ranking_id_seq OWNED BY public.fixed_food_ranking.id;


--
-- Name: gen_user_counters; Type: TABLE; Schema: public; Owner: intake24
--

CREATE TABLE public.gen_user_counters (
    survey_id bigint NOT NULL,
    count integer NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.gen_user_counters OWNER TO intake24;

--
-- Name: jobs; Type: TABLE; Schema: public; Owner: intake24
--

CREATE TABLE public.jobs (
    id bigint NOT NULL,
    type character varying(64) NOT NULL,
    user_id bigint,
    download_url character varying(1024),
    download_url_expires_at timestamp with time zone,
    progress double precision,
    successful boolean,
    message text,
    stack_trace text,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    params text
);


ALTER TABLE public.jobs OWNER TO intake24;

--
-- Name: jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: intake24
--

CREATE SEQUENCE public.jobs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.jobs_id_seq OWNER TO intake24;

--
-- Name: jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: intake24
--

ALTER SEQUENCE public.jobs_id_seq OWNED BY public.jobs.id;


--
-- Name: language_translations; Type: TABLE; Schema: public; Owner: intake24
--

CREATE TABLE public.language_translations (
    id bigint NOT NULL,
    language_id bigint,
    application character varying(64) NOT NULL,
    section character varying(64) NOT NULL,
    messages text NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.language_translations OWNER TO intake24;

--
-- Name: language_translations_id_seq; Type: SEQUENCE; Schema: public; Owner: intake24
--

CREATE SEQUENCE public.language_translations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.language_translations_id_seq OWNER TO intake24;

--
-- Name: language_translations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: intake24
--

ALTER SEQUENCE public.language_translations_id_seq OWNED BY public.language_translations.id;


--
-- Name: languages; Type: TABLE; Schema: public; Owner: intake24
--

CREATE TABLE public.languages (
    id bigint NOT NULL,
    code character varying(8) NOT NULL,
    english_name character varying(512) NOT NULL,
    local_name character varying(512) NOT NULL,
    country_flag_code character varying(16) NOT NULL,
    text_direction character varying(16) DEFAULT 'ltr'::character varying NOT NULL,
    owner_id bigint,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    visibility character varying(32) DEFAULT 'public'::character varying NOT NULL
);


ALTER TABLE public.languages OWNER TO intake24;

--
-- Name: languages_id_seq; Type: SEQUENCE; Schema: public; Owner: intake24
--

CREATE SEQUENCE public.languages_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.languages_id_seq OWNER TO intake24;

--
-- Name: languages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: intake24
--

ALTER SEQUENCE public.languages_id_seq OWNED BY public.languages.id;


--
-- Name: locales; Type: TABLE; Schema: public; Owner: intake24
--

CREATE TABLE public.locales (
    id bigint NOT NULL,
    code character varying(64) NOT NULL,
    english_name character varying(512) NOT NULL,
    local_name character varying(512) NOT NULL,
    respondent_language_id character varying(16) NOT NULL,
    admin_language_id character varying(16) NOT NULL,
    country_flag_code character varying(16) NOT NULL,
    text_direction character varying(16) DEFAULT 'ltr'::character varying NOT NULL,
    food_index_language_backend_id character varying(16) DEFAULT 'en'::character varying NOT NULL,
    owner_id bigint,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    food_index_enabled boolean DEFAULT false NOT NULL,
    visibility character varying(32) DEFAULT 'public'::character varying NOT NULL
);


ALTER TABLE public.locales OWNER TO intake24;

--
-- Name: locales_id_seq; Type: SEQUENCE; Schema: public; Owner: intake24
--

CREATE SEQUENCE public.locales_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.locales_id_seq OWNER TO intake24;

--
-- Name: locales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: intake24
--

ALTER SEQUENCE public.locales_id_seq OWNED BY public.locales.id;


--
-- Name: media; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.media (
    id uuid NOT NULL,
    model_type character varying(64) NOT NULL,
    model_id character varying(36),
    disk character varying(32) NOT NULL,
    collection character varying(64) NOT NULL,
    name character varying(128) NOT NULL,
    filename character varying(128) NOT NULL,
    mimetype character varying(128) NOT NULL,
    size integer NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.media OWNER TO postgres;

--
-- Name: mfa_authenticators; Type: TABLE; Schema: public; Owner: intake24
--

CREATE TABLE public.mfa_authenticators (
    id character varying(512) NOT NULL,
    device_id bigint NOT NULL,
    public_key bytea NOT NULL,
    counter bigint NOT NULL,
    device_type character varying(32) NOT NULL,
    backed_up boolean NOT NULL,
    transports text NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.mfa_authenticators OWNER TO intake24;

--
-- Name: mfa_devices; Type: TABLE; Schema: public; Owner: intake24
--

CREATE TABLE public.mfa_devices (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    provider character varying(32) NOT NULL,
    secret character varying(128) NOT NULL,
    name character varying(128) NOT NULL,
    preferred boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.mfa_devices OWNER TO intake24;

--
-- Name: mfa_devices_id_seq; Type: SEQUENCE; Schema: public; Owner: intake24
--

CREATE SEQUENCE public.mfa_devices_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.mfa_devices_id_seq OWNER TO intake24;

--
-- Name: mfa_devices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: intake24
--

ALTER SEQUENCE public.mfa_devices_id_seq OWNED BY public.mfa_devices.id;


--
-- Name: missing_foods; Type: TABLE; Schema: public; Owner: intake24
--

CREATE TABLE public.missing_foods (
    id bigint NOT NULL,
    survey_id bigint NOT NULL,
    user_id bigint NOT NULL,
    name character varying(512) NOT NULL,
    brand character varying(512) NOT NULL,
    description character varying(512) NOT NULL,
    portion_size character varying(512) NOT NULL,
    leftovers character varying(512) NOT NULL,
    submitted_at timestamp with time zone NOT NULL
);


ALTER TABLE public.missing_foods OWNER TO intake24;

--
-- Name: missing_foods_id_seq; Type: SEQUENCE; Schema: public; Owner: intake24
--

CREATE SEQUENCE public.missing_foods_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.missing_foods_id_seq OWNER TO intake24;

--
-- Name: missing_foods_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: intake24
--

ALTER SEQUENCE public.missing_foods_id_seq OWNED BY public.missing_foods.id;


--
-- Name: nutrient_types; Type: TABLE; Schema: public; Owner: intake24
--

CREATE TABLE public.nutrient_types (
    id bigint NOT NULL,
    description character varying(512) NOT NULL,
    unit_id bigint NOT NULL
);


ALTER TABLE public.nutrient_types OWNER TO intake24;

--
-- Name: nutrient_units; Type: TABLE; Schema: public; Owner: intake24
--

CREATE TABLE public.nutrient_units (
    id bigint NOT NULL,
    description character varying(512) NOT NULL,
    symbol character varying(32) NOT NULL
);


ALTER TABLE public.nutrient_units OWNER TO intake24;

--
-- Name: pairwise_associations_co_occurrences; Type: TABLE; Schema: public; Owner: intake24
--

CREATE TABLE public.pairwise_associations_co_occurrences (
    locale_id character varying(64) NOT NULL,
    antecedent_food_code character varying(64) NOT NULL,
    consequent_food_code character varying(64) NOT NULL,
    occurrences integer NOT NULL
);


ALTER TABLE public.pairwise_associations_co_occurrences OWNER TO intake24;

--
-- Name: pairwise_associations_occurrences; Type: TABLE; Schema: public; Owner: intake24
--

CREATE TABLE public.pairwise_associations_occurrences (
    locale_id character varying(64) NOT NULL,
    food_code character varying(64) NOT NULL,
    occurrences integer NOT NULL,
    multiplier integer
);


ALTER TABLE public.pairwise_associations_occurrences OWNER TO intake24;

--
-- Name: pairwise_associations_transactions_count; Type: TABLE; Schema: public; Owner: intake24
--

CREATE TABLE public.pairwise_associations_transactions_count (
    locale_id character varying(64) NOT NULL,
    transactions_count integer NOT NULL
);


ALTER TABLE public.pairwise_associations_transactions_count OWNER TO intake24;

--
-- Name: permission_role; Type: TABLE; Schema: public; Owner: intake24
--

CREATE TABLE public.permission_role (
    permission_id bigint NOT NULL,
    role_id bigint NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.permission_role OWNER TO intake24;

--
-- Name: permission_user; Type: TABLE; Schema: public; Owner: intake24
--

CREATE TABLE public.permission_user (
    permission_id bigint NOT NULL,
    user_id bigint NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.permission_user OWNER TO intake24;

--
-- Name: permissions; Type: TABLE; Schema: public; Owner: intake24
--

CREATE TABLE public.permissions (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    display_name character varying(255) NOT NULL,
    description text,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.permissions OWNER TO intake24;

--
-- Name: permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: intake24
--

CREATE SEQUENCE public.permissions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.permissions_id_seq OWNER TO intake24;

--
-- Name: permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: intake24
--

ALTER SEQUENCE public.permissions_id_seq OWNED BY public.permissions.id;


--
-- Name: personal_access_tokens; Type: TABLE; Schema: public; Owner: intake24
--

CREATE TABLE public.personal_access_tokens (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    name character varying(128) NOT NULL,
    token character varying(64) NOT NULL,
    scopes text,
    revoked boolean DEFAULT false NOT NULL,
    used_at timestamp with time zone,
    expires_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.personal_access_tokens OWNER TO intake24;

--
-- Name: personal_access_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: intake24
--

CREATE SEQUENCE public.personal_access_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.personal_access_tokens_id_seq OWNER TO intake24;

--
-- Name: personal_access_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: intake24
--

ALTER SEQUENCE public.personal_access_tokens_id_seq OWNED BY public.personal_access_tokens.id;


--
-- Name: popularity_counters; Type: TABLE; Schema: public; Owner: intake24
--

CREATE TABLE public.popularity_counters (
    food_code character varying(64) NOT NULL,
    counter integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.popularity_counters OWNER TO intake24;

--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: intake24
--

CREATE TABLE public.refresh_tokens (
    id character varying(255) NOT NULL,
    user_id bigint NOT NULL,
    revoked boolean DEFAULT false NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.refresh_tokens OWNER TO intake24;

--
-- Name: role_user; Type: TABLE; Schema: public; Owner: intake24
--

CREATE TABLE public.role_user (
    role_id bigint NOT NULL,
    user_id bigint NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.role_user OWNER TO intake24;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: intake24
--

CREATE TABLE public.roles (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    display_name character varying(255) NOT NULL,
    description text,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.roles OWNER TO intake24;

--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: intake24
--

CREATE SEQUENCE public.roles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_id_seq OWNER TO intake24;

--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: intake24
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: survey_scheme_prompts; Type: TABLE; Schema: public; Owner: intake24
--

CREATE TABLE public.survey_scheme_prompts (
    id bigint NOT NULL,
    prompt_id character varying(128) NOT NULL,
    name character varying(512) NOT NULL,
    prompt text NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.survey_scheme_prompts OWNER TO intake24;

--
-- Name: scheme_questions_id_seq; Type: SEQUENCE; Schema: public; Owner: intake24
--

CREATE SEQUENCE public.scheme_questions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.scheme_questions_id_seq OWNER TO intake24;

--
-- Name: scheme_questions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: intake24
--

ALTER SEQUENCE public.scheme_questions_id_seq OWNED BY public.survey_scheme_prompts.id;


--
-- Name: sequelize_meta; Type: TABLE; Schema: public; Owner: intake24
--

CREATE TABLE public.sequelize_meta (
    name character varying(255) NOT NULL
);


ALTER TABLE public.sequelize_meta OWNER TO intake24;

--
-- Name: short_urls; Type: TABLE; Schema: public; Owner: intake24
--

CREATE TABLE public.short_urls (
    long_url character varying(1000) NOT NULL,
    short_url character varying(100) NOT NULL
);


ALTER TABLE public.short_urls OWNER TO intake24;

--
-- Name: signin_log; Type: TABLE; Schema: public; Owner: intake24
--

CREATE TABLE public.signin_log (
    id bigint NOT NULL,
    user_id bigint,
    date timestamp with time zone NOT NULL,
    remote_address character varying(64),
    provider character varying(64) NOT NULL,
    provider_key character varying(512) NOT NULL,
    successful boolean NOT NULL,
    message text,
    user_agent character varying(512)
);


ALTER TABLE public.signin_log OWNER TO intake24;

--
-- Name: signin_log_id_seq; Type: SEQUENCE; Schema: public; Owner: intake24
--

CREATE SEQUENCE public.signin_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.signin_log_id_seq OWNER TO intake24;

--
-- Name: signin_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: intake24
--

ALTER SEQUENCE public.signin_log_id_seq OWNED BY public.signin_log.id;


--
-- Name: survey_schemes; Type: TABLE; Schema: public; Owner: intake24
--

CREATE TABLE public.survey_schemes (
    id bigint NOT NULL,
    name character varying(256) NOT NULL,
    settings text NOT NULL,
    prompts text,
    meals text,
    data_export text,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    owner_id bigint,
    visibility character varying(32) DEFAULT 'public'::character varying NOT NULL
);


ALTER TABLE public.survey_schemes OWNER TO intake24;

--
-- Name: survey_schemes_id_seq; Type: SEQUENCE; Schema: public; Owner: intake24
--

CREATE SEQUENCE public.survey_schemes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.survey_schemes_id_seq OWNER TO intake24;

--
-- Name: survey_schemes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: intake24
--

ALTER SEQUENCE public.survey_schemes_id_seq OWNED BY public.survey_schemes.id;


--
-- Name: survey_submission_custom_fields; Type: TABLE; Schema: public; Owner: intake24
--

CREATE TABLE public.survey_submission_custom_fields (
    id uuid NOT NULL,
    survey_submission_id uuid NOT NULL,
    name character varying(64) NOT NULL,
    value character varying(2048) NOT NULL
);


ALTER TABLE public.survey_submission_custom_fields OWNER TO intake24;

--
-- Name: survey_submission_external_sources; Type: TABLE; Schema: public; Owner: intake24
--

CREATE TABLE public.survey_submission_external_sources (
    id uuid NOT NULL,
    food_id uuid NOT NULL,
    food_type character varying(64) NOT NULL,
    source character varying(64) NOT NULL,
    search_term character varying(256),
    type character varying(64),
    data text
);


ALTER TABLE public.survey_submission_external_sources OWNER TO intake24;

--
-- Name: survey_submission_fields; Type: TABLE; Schema: public; Owner: intake24
--

CREATE TABLE public.survey_submission_fields (
    id uuid NOT NULL,
    food_id uuid NOT NULL,
    field_name character varying(64) NOT NULL,
    value character varying(512) NOT NULL
);


ALTER TABLE public.survey_submission_fields OWNER TO intake24;

--
-- Name: survey_submission_food_custom_fields; Type: TABLE; Schema: public; Owner: intake24
--

CREATE TABLE public.survey_submission_food_custom_fields (
    id uuid NOT NULL,
    food_id uuid NOT NULL,
    name character varying(64) NOT NULL,
    value character varying(2048) NOT NULL
);


ALTER TABLE public.survey_submission_food_custom_fields OWNER TO intake24;

--
-- Name: survey_submission_foods; Type: TABLE; Schema: public; Owner: intake24
--

CREATE TABLE public.survey_submission_foods (
    id uuid NOT NULL,
    parent_id uuid,
    meal_id uuid NOT NULL,
    code character varying(64) NOT NULL,
    english_name character varying(256) NOT NULL,
    local_name character varying(256),
    ready_meal boolean NOT NULL,
    search_term character varying(256) NOT NULL,
    portion_size_method_id character varying(32) NOT NULL,
    reasonable_amount boolean NOT NULL,
    brand character varying(128),
    nutrient_table_id character varying(64) NOT NULL,
    nutrient_table_code character varying(64) NOT NULL,
    index integer NOT NULL,
    barcode character varying(128),
    locale character varying(64) NOT NULL
);


ALTER TABLE public.survey_submission_foods OWNER TO intake24;

--
-- Name: survey_submission_meal_custom_fields; Type: TABLE; Schema: public; Owner: intake24
--

CREATE TABLE public.survey_submission_meal_custom_fields (
    id uuid NOT NULL,
    meal_id uuid NOT NULL,
    name character varying(64) NOT NULL,
    value character varying(2048) NOT NULL
);


ALTER TABLE public.survey_submission_meal_custom_fields OWNER TO intake24;

--
-- Name: survey_submission_meals; Type: TABLE; Schema: public; Owner: intake24
--

CREATE TABLE public.survey_submission_meals (
    id uuid NOT NULL,
    survey_submission_id uuid NOT NULL,
    hours integer NOT NULL,
    minutes integer NOT NULL,
    name character varying(64),
    duration integer
);


ALTER TABLE public.survey_submission_meals OWNER TO intake24;

--
-- Name: survey_submission_missing_foods; Type: TABLE; Schema: public; Owner: intake24
--

CREATE TABLE public.survey_submission_missing_foods (
    id uuid NOT NULL,
    parent_id uuid,
    meal_id uuid NOT NULL,
    name character varying(512),
    brand character varying(512),
    description character varying(1024),
    portion_size character varying(1024),
    leftovers character varying(1024),
    index integer NOT NULL,
    barcode character varying(128)
);


ALTER TABLE public.survey_submission_missing_foods OWNER TO intake24;

--
-- Name: survey_submission_nutrients; Type: TABLE; Schema: public; Owner: intake24
--

CREATE TABLE public.survey_submission_nutrients (
    id uuid NOT NULL,
    food_id uuid NOT NULL,
    amount double precision NOT NULL,
    nutrient_type_id bigint NOT NULL
);


ALTER TABLE public.survey_submission_nutrients OWNER TO intake24;

--
-- Name: survey_submission_portion_size_fields; Type: TABLE; Schema: public; Owner: intake24
--

CREATE TABLE public.survey_submission_portion_size_fields (
    id uuid NOT NULL,
    food_id uuid NOT NULL,
    name character varying(64) NOT NULL,
    value character varying(512) NOT NULL
);


ALTER TABLE public.survey_submission_portion_size_fields OWNER TO intake24;

--
-- Name: survey_submissions; Type: TABLE; Schema: public; Owner: intake24
--

CREATE TABLE public.survey_submissions (
    id uuid NOT NULL,
    survey_id bigint NOT NULL,
    user_id bigint NOT NULL,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL,
    submission_time timestamp with time zone NOT NULL,
    log text,
    session_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    user_agent character varying(512),
    recall_date date,
    wake_up_time time without time zone,
    sleep_time time without time zone
);


ALTER TABLE public.survey_submissions OWNER TO intake24;

--
-- Name: surveys; Type: TABLE; Schema: public; Owner: intake24
--

CREATE TABLE public.surveys (
    id bigint NOT NULL,
    slug character varying(128) NOT NULL,
    name character varying(512) NOT NULL,
    state character varying(64) NOT NULL,
    start_date timestamp with time zone NOT NULL,
    end_date timestamp with time zone NOT NULL,
    locale_id bigint,
    survey_scheme_id bigint NOT NULL,
    feedback_scheme_id bigint,
    allow_gen_users boolean,
    gen_user_key character varying(256),
    support_email character varying(512),
    suspension_reason character varying(512),
    survey_monkey_url character varying(512),
    originating_url character varying(512),
    notifications text DEFAULT '[]'::character varying NOT NULL,
    number_of_submissions_for_feedback integer DEFAULT 1 NOT NULL,
    maximum_daily_submissions integer DEFAULT 3 NOT NULL,
    minimum_submission_interval integer DEFAULT 600 NOT NULL,
    maximum_total_submissions integer,
    auth_url_domain_override character varying(512),
    auth_url_token_charset character varying(128),
    auth_url_token_length integer,
    survey_scheme_overrides text,
    user_personal_identifiers boolean DEFAULT false NOT NULL,
    user_custom_fields boolean DEFAULT false NOT NULL,
    owner_id bigint,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    auth_captcha boolean DEFAULT false NOT NULL,
    search_settings text,
    session text,
    faq_id bigint
);


ALTER TABLE public.surveys OWNER TO intake24;

--
-- Name: surveys_id_seq; Type: SEQUENCE; Schema: public; Owner: intake24
--

CREATE SEQUENCE public.surveys_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.surveys_id_seq OWNER TO intake24;

--
-- Name: surveys_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: intake24
--

ALTER SEQUENCE public.surveys_id_seq OWNED BY public.surveys.id;


--
-- Name: surveys_ux_events_settings; Type: TABLE; Schema: public; Owner: intake24
--

CREATE TABLE public.surveys_ux_events_settings (
    survey_id bigint NOT NULL,
    enable_search_events boolean NOT NULL,
    enable_associated_foods_events boolean NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.surveys_ux_events_settings OWNER TO intake24;

--
-- Name: tasks; Type: TABLE; Schema: public; Owner: intake24
--

CREATE TABLE public.tasks (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    job character varying(255) NOT NULL,
    cron character varying(255) NOT NULL,
    active boolean DEFAULT false NOT NULL,
    description text,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    params text
);


ALTER TABLE public.tasks OWNER TO intake24;

--
-- Name: tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: intake24
--

CREATE SEQUENCE public.tasks_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tasks_id_seq OWNER TO intake24;

--
-- Name: tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: intake24
--

ALTER SEQUENCE public.tasks_id_seq OWNED BY public.tasks.id;


--
-- Name: user_custom_fields; Type: TABLE; Schema: public; Owner: intake24
--

CREATE TABLE public.user_custom_fields (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    name character varying(128) NOT NULL,
    value character varying(512) NOT NULL,
    public boolean DEFAULT false NOT NULL
);


ALTER TABLE public.user_custom_fields OWNER TO intake24;

--
-- Name: user_custom_fields_id_seq; Type: SEQUENCE; Schema: public; Owner: intake24
--

CREATE SEQUENCE public.user_custom_fields_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_custom_fields_id_seq OWNER TO intake24;

--
-- Name: user_custom_fields_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: intake24
--

ALTER SEQUENCE public.user_custom_fields_id_seq OWNED BY public.user_custom_fields.id;


--
-- Name: user_notification_schedule; Type: TABLE; Schema: public; Owner: intake24
--

CREATE TABLE public.user_notification_schedule (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    survey_id bigint,
    datetime timestamp with time zone NOT NULL,
    notification_type character varying(128)
);


ALTER TABLE public.user_notification_schedule OWNER TO intake24;

--
-- Name: user_notification_schedule_id_seq; Type: SEQUENCE; Schema: public; Owner: intake24
--

CREATE SEQUENCE public.user_notification_schedule_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_notification_schedule_id_seq OWNER TO intake24;

--
-- Name: user_notification_schedule_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: intake24
--

ALTER SEQUENCE public.user_notification_schedule_id_seq OWNED BY public.user_notification_schedule.id;


--
-- Name: user_password_resets; Type: TABLE; Schema: public; Owner: intake24
--

CREATE TABLE public.user_password_resets (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    token character varying(255) NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


ALTER TABLE public.user_password_resets OWNER TO intake24;

--
-- Name: user_password_resets_id_seq; Type: SEQUENCE; Schema: public; Owner: intake24
--

CREATE SEQUENCE public.user_password_resets_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_password_resets_id_seq OWNER TO intake24;

--
-- Name: user_password_resets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: intake24
--

ALTER SEQUENCE public.user_password_resets_id_seq OWNED BY public.user_password_resets.id;


--
-- Name: user_passwords; Type: TABLE; Schema: public; Owner: intake24
--

CREATE TABLE public.user_passwords (
    user_id bigint NOT NULL,
    password_hash character varying(128) NOT NULL,
    password_salt character varying(128) NOT NULL,
    password_hasher character varying(64) NOT NULL
);


ALTER TABLE public.user_passwords OWNER TO intake24;

--
-- Name: user_physical_data; Type: TABLE; Schema: public; Owner: intake24
--

CREATE TABLE public.user_physical_data (
    user_id bigint NOT NULL,
    sex character varying(64),
    weight_kg double precision,
    height_cm double precision,
    physical_activity_level_id bigint,
    birthdate date,
    weight_target character varying(64)
);


ALTER TABLE public.user_physical_data OWNER TO intake24;

--
-- Name: user_securables; Type: TABLE; Schema: public; Owner: intake24
--

CREATE TABLE public.user_securables (
    user_id bigint NOT NULL,
    securable_id bigint NOT NULL,
    securable_type character varying(64) NOT NULL,
    action character varying(64) NOT NULL,
    fields text,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.user_securables OWNER TO intake24;

--
-- Name: user_subscriptions; Type: TABLE; Schema: public; Owner: intake24
--

CREATE TABLE public.user_subscriptions (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    type character varying(32) NOT NULL,
    subscription text NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.user_subscriptions OWNER TO intake24;

--
-- Name: user_subscriptions_id_seq; Type: SEQUENCE; Schema: public; Owner: intake24
--

CREATE SEQUENCE public.user_subscriptions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_subscriptions_id_seq OWNER TO intake24;

--
-- Name: user_subscriptions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: intake24
--

ALTER SEQUENCE public.user_subscriptions_id_seq OWNED BY public.user_subscriptions.id;


--
-- Name: user_survey_aliases; Type: TABLE; Schema: public; Owner: intake24
--

CREATE TABLE public.user_survey_aliases (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    survey_id bigint NOT NULL,
    username character varying(256) NOT NULL,
    url_auth_token character varying(128) NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.user_survey_aliases OWNER TO intake24;

--
-- Name: user_survey_aliases_id_seq; Type: SEQUENCE; Schema: public; Owner: intake24
--

CREATE SEQUENCE public.user_survey_aliases_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_survey_aliases_id_seq OWNER TO intake24;

--
-- Name: user_survey_aliases_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: intake24
--

ALTER SEQUENCE public.user_survey_aliases_id_seq OWNED BY public.user_survey_aliases.id;


--
-- Name: user_survey_ratings; Type: TABLE; Schema: public; Owner: intake24
--

CREATE TABLE public.user_survey_ratings (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    survey_id bigint NOT NULL,
    type character varying(16) NOT NULL,
    submission_id uuid,
    rating smallint NOT NULL,
    comment text,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.user_survey_ratings OWNER TO intake24;

--
-- Name: user_survey_ratings_id_seq; Type: SEQUENCE; Schema: public; Owner: intake24
--

CREATE SEQUENCE public.user_survey_ratings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_survey_ratings_id_seq OWNER TO intake24;

--
-- Name: user_survey_ratings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: intake24
--

ALTER SEQUENCE public.user_survey_ratings_id_seq OWNED BY public.user_survey_ratings.id;


--
-- Name: user_survey_sessions; Type: TABLE; Schema: public; Owner: intake24
--

CREATE TABLE public.user_survey_sessions (
    id uuid NOT NULL,
    user_id bigint NOT NULL,
    survey_id bigint NOT NULL,
    session_data text NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.user_survey_sessions OWNER TO intake24;

--
-- Name: users; Type: TABLE; Schema: public; Owner: intake24
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    name character varying(512),
    email character varying(512),
    phone character varying(32),
    simple_name character varying(512),
    email_notifications boolean DEFAULT true NOT NULL,
    sms_notifications boolean DEFAULT true NOT NULL,
    multi_factor_authentication boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    verified_at timestamp with time zone,
    disabled_at timestamp with time zone
);


ALTER TABLE public.users OWNER TO intake24;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: intake24
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO intake24;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: intake24
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: ux_events; Type: TABLE; Schema: public; Owner: intake24
--

CREATE TABLE public.ux_events (
    id integer NOT NULL,
    event_categories character varying(500)[] NOT NULL,
    event_type character varying(500) NOT NULL,
    data json NOT NULL,
    created timestamp with time zone DEFAULT now() NOT NULL,
    session_id uuid NOT NULL,
    user_id bigint NOT NULL,
    local_timestamp bigint
);


ALTER TABLE public.ux_events OWNER TO intake24;

--
-- Name: ux_events_id_seq; Type: SEQUENCE; Schema: public; Owner: intake24
--

CREATE SEQUENCE public.ux_events_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ux_events_id_seq OWNER TO intake24;

--
-- Name: ux_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: intake24
--

ALTER SEQUENCE public.ux_events_id_seq OWNED BY public.ux_events.id;


--
-- Name: v3_survey_submission_foods_id_seq; Type: SEQUENCE; Schema: public; Owner: intake24
--

CREATE SEQUENCE public.v3_survey_submission_foods_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.v3_survey_submission_foods_id_seq OWNER TO intake24;

--
-- Name: client_error_reports id; Type: DEFAULT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.client_error_reports ALTER COLUMN id SET DEFAULT nextval('public.client_error_reports_id_seq'::regclass);


--
-- Name: external_test_users id; Type: DEFAULT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.external_test_users ALTER COLUMN id SET DEFAULT nextval('public.external_test_users_id_seq'::regclass);


--
-- Name: faqs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.faqs ALTER COLUMN id SET DEFAULT nextval('public.faqs_id_seq'::regclass);


--
-- Name: feedback_schemes id; Type: DEFAULT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.feedback_schemes ALTER COLUMN id SET DEFAULT nextval('public.feedback_schemes_id_seq'::regclass);


--
-- Name: fixed_food_ranking id; Type: DEFAULT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.fixed_food_ranking ALTER COLUMN id SET DEFAULT nextval('public.fixed_food_ranking_id_seq'::regclass);


--
-- Name: jobs id; Type: DEFAULT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.jobs ALTER COLUMN id SET DEFAULT nextval('public.jobs_id_seq'::regclass);


--
-- Name: language_translations id; Type: DEFAULT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.language_translations ALTER COLUMN id SET DEFAULT nextval('public.language_translations_id_seq'::regclass);


--
-- Name: languages id; Type: DEFAULT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.languages ALTER COLUMN id SET DEFAULT nextval('public.languages_id_seq'::regclass);


--
-- Name: locales id; Type: DEFAULT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.locales ALTER COLUMN id SET DEFAULT nextval('public.locales_id_seq'::regclass);


--
-- Name: mfa_devices id; Type: DEFAULT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.mfa_devices ALTER COLUMN id SET DEFAULT nextval('public.mfa_devices_id_seq'::regclass);


--
-- Name: missing_foods id; Type: DEFAULT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.missing_foods ALTER COLUMN id SET DEFAULT nextval('public.missing_foods_id_seq'::regclass);


--
-- Name: permissions id; Type: DEFAULT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.permissions ALTER COLUMN id SET DEFAULT nextval('public.permissions_id_seq'::regclass);


--
-- Name: personal_access_tokens id; Type: DEFAULT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.personal_access_tokens ALTER COLUMN id SET DEFAULT nextval('public.personal_access_tokens_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: signin_log id; Type: DEFAULT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.signin_log ALTER COLUMN id SET DEFAULT nextval('public.signin_log_id_seq'::regclass);


--
-- Name: survey_scheme_prompts id; Type: DEFAULT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.survey_scheme_prompts ALTER COLUMN id SET DEFAULT nextval('public.scheme_questions_id_seq'::regclass);


--
-- Name: survey_schemes id; Type: DEFAULT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.survey_schemes ALTER COLUMN id SET DEFAULT nextval('public.survey_schemes_id_seq'::regclass);


--
-- Name: surveys id; Type: DEFAULT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.surveys ALTER COLUMN id SET DEFAULT nextval('public.surveys_id_seq'::regclass);


--
-- Name: tasks id; Type: DEFAULT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.tasks ALTER COLUMN id SET DEFAULT nextval('public.tasks_id_seq'::regclass);


--
-- Name: user_custom_fields id; Type: DEFAULT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.user_custom_fields ALTER COLUMN id SET DEFAULT nextval('public.user_custom_fields_id_seq'::regclass);


--
-- Name: user_notification_schedule id; Type: DEFAULT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.user_notification_schedule ALTER COLUMN id SET DEFAULT nextval('public.user_notification_schedule_id_seq'::regclass);


--
-- Name: user_password_resets id; Type: DEFAULT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.user_password_resets ALTER COLUMN id SET DEFAULT nextval('public.user_password_resets_id_seq'::regclass);


--
-- Name: user_subscriptions id; Type: DEFAULT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.user_subscriptions ALTER COLUMN id SET DEFAULT nextval('public.user_subscriptions_id_seq'::regclass);


--
-- Name: user_survey_aliases id; Type: DEFAULT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.user_survey_aliases ALTER COLUMN id SET DEFAULT nextval('public.user_survey_aliases_id_seq'::regclass);


--
-- Name: user_survey_ratings id; Type: DEFAULT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.user_survey_ratings ALTER COLUMN id SET DEFAULT nextval('public.user_survey_ratings_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: ux_events id; Type: DEFAULT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.ux_events ALTER COLUMN id SET DEFAULT nextval('public.ux_events_id_seq'::regclass);


--
-- Name: client_error_reports client_error_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.client_error_reports
    ADD CONSTRAINT client_error_reports_pkey PRIMARY KEY (id);


--
-- Name: external_test_users external_test_users_pk; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.external_test_users
    ADD CONSTRAINT external_test_users_pk PRIMARY KEY (id);


--
-- Name: faqs faqs_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.faqs
    ADD CONSTRAINT faqs_name_key UNIQUE (name);


--
-- Name: faqs faqs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.faqs
    ADD CONSTRAINT faqs_pkey PRIMARY KEY (id);


--
-- Name: feedback_schemes feedback_schemes_name_key; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.feedback_schemes
    ADD CONSTRAINT feedback_schemes_name_key UNIQUE (name);


--
-- Name: feedback_schemes feedback_schemes_pkey; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.feedback_schemes
    ADD CONSTRAINT feedback_schemes_pkey PRIMARY KEY (id);


--
-- Name: fixed_food_ranking fixed_food_ranking_pkey; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.fixed_food_ranking
    ADD CONSTRAINT fixed_food_ranking_pkey PRIMARY KEY (id);


--
-- Name: gen_user_counters gen_user_counters_pkey; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.gen_user_counters
    ADD CONSTRAINT gen_user_counters_pkey PRIMARY KEY (survey_id);


--
-- Name: jobs jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY (id);


--
-- Name: language_translations language_translations_pkey; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.language_translations
    ADD CONSTRAINT language_translations_pkey PRIMARY KEY (id);


--
-- Name: language_translations language_translations_unique; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.language_translations
    ADD CONSTRAINT language_translations_unique UNIQUE (language_id, application, section);


--
-- Name: languages languages_code_key; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.languages
    ADD CONSTRAINT languages_code_key UNIQUE (code);


--
-- Name: languages languages_english_name_key1; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.languages
    ADD CONSTRAINT languages_english_name_key1 UNIQUE (english_name);


--
-- Name: languages languages_local_name_key1; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.languages
    ADD CONSTRAINT languages_local_name_key1 UNIQUE (local_name);


--
-- Name: languages languages_pkey; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.languages
    ADD CONSTRAINT languages_pkey PRIMARY KEY (id);


--
-- Name: locales locales_code_key; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.locales
    ADD CONSTRAINT locales_code_key UNIQUE (code);


--
-- Name: locales locales_english_name_key; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.locales
    ADD CONSTRAINT locales_english_name_key UNIQUE (english_name);


--
-- Name: locales locales_local_name_key; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.locales
    ADD CONSTRAINT locales_local_name_key UNIQUE (local_name);


--
-- Name: locales locales_pkey; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.locales
    ADD CONSTRAINT locales_pkey PRIMARY KEY (id);


--
-- Name: media media_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.media
    ADD CONSTRAINT media_pkey PRIMARY KEY (id);


--
-- Name: mfa_authenticators mfa_authenticators_device_id_key; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.mfa_authenticators
    ADD CONSTRAINT mfa_authenticators_device_id_key UNIQUE (device_id);


--
-- Name: mfa_authenticators mfa_authenticators_pkey; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.mfa_authenticators
    ADD CONSTRAINT mfa_authenticators_pkey PRIMARY KEY (id);


--
-- Name: mfa_devices mfa_devices_pkey; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.mfa_devices
    ADD CONSTRAINT mfa_devices_pkey PRIMARY KEY (id);


--
-- Name: missing_foods missing_foods_pkey; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.missing_foods
    ADD CONSTRAINT missing_foods_pkey PRIMARY KEY (id);


--
-- Name: nutrient_types nutrient_types_pkey; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.nutrient_types
    ADD CONSTRAINT nutrient_types_pkey PRIMARY KEY (id);


--
-- Name: nutrient_units nutrient_units_pkey; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.nutrient_units
    ADD CONSTRAINT nutrient_units_pkey PRIMARY KEY (id);


--
-- Name: pairwise_associations_co_occurrences pairwise_associations_co_occurrences_pkey; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.pairwise_associations_co_occurrences
    ADD CONSTRAINT pairwise_associations_co_occurrences_pkey PRIMARY KEY (locale_id, antecedent_food_code, consequent_food_code);


--
-- Name: pairwise_associations_occurrences pairwise_associations_occurrences_copy_pkey; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.pairwise_associations_occurrences
    ADD CONSTRAINT pairwise_associations_occurrences_copy_pkey PRIMARY KEY (locale_id, food_code);


--
-- Name: pairwise_associations_transactions_count pairwise_associations_transactions_count_copy_pkey; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.pairwise_associations_transactions_count
    ADD CONSTRAINT pairwise_associations_transactions_count_copy_pkey PRIMARY KEY (locale_id);


--
-- Name: permission_role permission_role_permission_id_role_id_pk; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.permission_role
    ADD CONSTRAINT permission_role_permission_id_role_id_pk PRIMARY KEY (permission_id, role_id);


--
-- Name: permission_user permission_user_permission_id_user_id_pk; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.permission_user
    ADD CONSTRAINT permission_user_permission_id_user_id_pk PRIMARY KEY (permission_id, user_id);


--
-- Name: permissions permissions_name_key; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_name_key UNIQUE (name);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: personal_access_tokens personal_access_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.personal_access_tokens
    ADD CONSTRAINT personal_access_tokens_pkey PRIMARY KEY (id);


--
-- Name: personal_access_tokens personal_access_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.personal_access_tokens
    ADD CONSTRAINT personal_access_tokens_token_key UNIQUE (token);


--
-- Name: popularity_counters popularity_counters_pk; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.popularity_counters
    ADD CONSTRAINT popularity_counters_pk PRIMARY KEY (food_code);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: role_user role_user_role_id_user_id_pk; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.role_user
    ADD CONSTRAINT role_user_role_id_user_id_pk PRIMARY KEY (role_id, user_id);


--
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: survey_scheme_prompts scheme_prompts_pkey; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.survey_scheme_prompts
    ADD CONSTRAINT scheme_prompts_pkey PRIMARY KEY (id);


--
-- Name: survey_scheme_prompts scheme_prompts_prompt_id_key; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.survey_scheme_prompts
    ADD CONSTRAINT scheme_prompts_prompt_id_key UNIQUE (prompt_id);


--
-- Name: sequelize_meta sequelize_meta_pkey; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.sequelize_meta
    ADD CONSTRAINT sequelize_meta_pkey PRIMARY KEY (name);


--
-- Name: short_urls short_urls_pkey; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.short_urls
    ADD CONSTRAINT short_urls_pkey PRIMARY KEY (long_url);


--
-- Name: short_urls short_urls_unique; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.short_urls
    ADD CONSTRAINT short_urls_unique UNIQUE (short_url);


--
-- Name: signin_log signin_log_pkey; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.signin_log
    ADD CONSTRAINT signin_log_pkey PRIMARY KEY (id);


--
-- Name: survey_schemes survey_schemes_name_key; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.survey_schemes
    ADD CONSTRAINT survey_schemes_name_key UNIQUE (name);


--
-- Name: survey_schemes survey_schemes_pkey; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.survey_schemes
    ADD CONSTRAINT survey_schemes_pkey PRIMARY KEY (id);


--
-- Name: survey_submission_custom_fields survey_submission_custom_fields_pkey; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.survey_submission_custom_fields
    ADD CONSTRAINT survey_submission_custom_fields_pkey PRIMARY KEY (id);


--
-- Name: survey_submission_custom_fields survey_submission_custom_fields_unique; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.survey_submission_custom_fields
    ADD CONSTRAINT survey_submission_custom_fields_unique UNIQUE (survey_submission_id, name);


--
-- Name: survey_submission_external_sources survey_submission_external_sources_pkey; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.survey_submission_external_sources
    ADD CONSTRAINT survey_submission_external_sources_pkey PRIMARY KEY (id);


--
-- Name: survey_submission_external_sources survey_submission_external_sources_unique; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.survey_submission_external_sources
    ADD CONSTRAINT survey_submission_external_sources_unique UNIQUE (food_id, food_type, source);


--
-- Name: survey_submission_fields survey_submission_fields_pkey; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.survey_submission_fields
    ADD CONSTRAINT survey_submission_fields_pkey PRIMARY KEY (id);


--
-- Name: survey_submission_food_custom_fields survey_submission_food_custom_fields_pkey; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.survey_submission_food_custom_fields
    ADD CONSTRAINT survey_submission_food_custom_fields_pkey PRIMARY KEY (id);


--
-- Name: survey_submission_food_custom_fields survey_submission_food_custom_fields_unique; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.survey_submission_food_custom_fields
    ADD CONSTRAINT survey_submission_food_custom_fields_unique UNIQUE (food_id, name);


--
-- Name: survey_submission_foods survey_submission_foods_pkey; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.survey_submission_foods
    ADD CONSTRAINT survey_submission_foods_pkey PRIMARY KEY (id);


--
-- Name: survey_submission_meal_custom_fields survey_submission_meal_custom_fields_pkey; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.survey_submission_meal_custom_fields
    ADD CONSTRAINT survey_submission_meal_custom_fields_pkey PRIMARY KEY (id);


--
-- Name: survey_submission_meal_custom_fields survey_submission_meal_custom_fields_unique; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.survey_submission_meal_custom_fields
    ADD CONSTRAINT survey_submission_meal_custom_fields_unique UNIQUE (meal_id, name);


--
-- Name: survey_submission_meals survey_submission_meals_pkey; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.survey_submission_meals
    ADD CONSTRAINT survey_submission_meals_pkey PRIMARY KEY (id);


--
-- Name: survey_submission_missing_foods survey_submission_missing_foods_pkey; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.survey_submission_missing_foods
    ADD CONSTRAINT survey_submission_missing_foods_pkey PRIMARY KEY (id);


--
-- Name: survey_submission_nutrients survey_submission_nutrients_pkey; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.survey_submission_nutrients
    ADD CONSTRAINT survey_submission_nutrients_pkey PRIMARY KEY (id);


--
-- Name: survey_submission_portion_size_fields survey_submission_portion_size_fields_pkey; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.survey_submission_portion_size_fields
    ADD CONSTRAINT survey_submission_portion_size_fields_pkey PRIMARY KEY (id);


--
-- Name: survey_submissions survey_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.survey_submissions
    ADD CONSTRAINT survey_submissions_pkey PRIMARY KEY (id);


--
-- Name: survey_submissions survey_submissions_session_id_unique; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.survey_submissions
    ADD CONSTRAINT survey_submissions_session_id_unique UNIQUE (session_id);


--
-- Name: surveys surveys_name_key; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.surveys
    ADD CONSTRAINT surveys_name_key UNIQUE (name);


--
-- Name: surveys surveys_pkey; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.surveys
    ADD CONSTRAINT surveys_pkey PRIMARY KEY (id);


--
-- Name: surveys surveys_slug_key; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.surveys
    ADD CONSTRAINT surveys_slug_key UNIQUE (slug);


--
-- Name: surveys_ux_events_settings surveys_ux_events_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.surveys_ux_events_settings
    ADD CONSTRAINT surveys_ux_events_settings_pkey PRIMARY KEY (survey_id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: user_custom_fields user_custom_fields_pkey; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.user_custom_fields
    ADD CONSTRAINT user_custom_fields_pkey PRIMARY KEY (id);


--
-- Name: user_custom_fields user_custom_fields_unique; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.user_custom_fields
    ADD CONSTRAINT user_custom_fields_unique UNIQUE (user_id, name);


--
-- Name: user_physical_data user_info_pkey; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.user_physical_data
    ADD CONSTRAINT user_info_pkey PRIMARY KEY (user_id);


--
-- Name: user_notification_schedule user_notification_schedule_pkey; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.user_notification_schedule
    ADD CONSTRAINT user_notification_schedule_pkey PRIMARY KEY (id);


--
-- Name: user_password_resets user_password_resets_pkey; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.user_password_resets
    ADD CONSTRAINT user_password_resets_pkey PRIMARY KEY (id);


--
-- Name: user_passwords user_passwords_pkey; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.user_passwords
    ADD CONSTRAINT user_passwords_pkey PRIMARY KEY (user_id);


--
-- Name: user_securables user_securables_pkey; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.user_securables
    ADD CONSTRAINT user_securables_pkey PRIMARY KEY (user_id, securable_id, securable_type, action);


--
-- Name: user_subscriptions user_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.user_subscriptions
    ADD CONSTRAINT user_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: user_survey_aliases user_survey_aliases_pkey; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.user_survey_aliases
    ADD CONSTRAINT user_survey_aliases_pkey PRIMARY KEY (id);


--
-- Name: user_survey_aliases user_survey_aliases_survey_id_username_unique; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.user_survey_aliases
    ADD CONSTRAINT user_survey_aliases_survey_id_username_unique UNIQUE (survey_id, username);


--
-- Name: user_survey_aliases user_survey_aliases_url_auth_token_key; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.user_survey_aliases
    ADD CONSTRAINT user_survey_aliases_url_auth_token_key UNIQUE (url_auth_token);


--
-- Name: user_survey_ratings user_survey_ratings_pkey; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.user_survey_ratings
    ADD CONSTRAINT user_survey_ratings_pkey PRIMARY KEY (id);


--
-- Name: user_survey_sessions user_survey_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.user_survey_sessions
    ADD CONSTRAINT user_survey_sessions_pkey PRIMARY KEY (id);


--
-- Name: user_survey_sessions user_survey_sessions_survey_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.user_survey_sessions
    ADD CONSTRAINT user_survey_sessions_survey_id_user_id_key UNIQUE (survey_id, user_id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: ux_events ux_events_pkey; Type: CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.ux_events
    ADD CONSTRAINT ux_events_pkey PRIMARY KEY (id);


--
-- Name: client_error_reports_survey_id_idx; Type: INDEX; Schema: public; Owner: intake24
--

CREATE INDEX client_error_reports_survey_id_idx ON public.client_error_reports USING btree (survey_id);


--
-- Name: client_error_reports_user_id_idx; Type: INDEX; Schema: public; Owner: intake24
--

CREATE INDEX client_error_reports_user_id_idx ON public.client_error_reports USING btree (user_id);


--
-- Name: faqs_name_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX faqs_name_idx ON public.faqs USING btree (name);


--
-- Name: faqs_owner_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX faqs_owner_id_idx ON public.faqs USING btree (owner_id);


--
-- Name: feedback_schemes_owner_id_idx; Type: INDEX; Schema: public; Owner: intake24
--

CREATE INDEX feedback_schemes_owner_id_idx ON public.feedback_schemes USING btree (owner_id);


--
-- Name: fixed_food_ranking_index; Type: INDEX; Schema: public; Owner: intake24
--

CREATE INDEX fixed_food_ranking_index ON public.fixed_food_ranking USING btree (locale_id, food_code);


--
-- Name: jobs_user_id_idx; Type: INDEX; Schema: public; Owner: intake24
--

CREATE INDEX jobs_user_id_idx ON public.jobs USING btree (user_id);


--
-- Name: language_translations_language_id_idx; Type: INDEX; Schema: public; Owner: intake24
--

CREATE INDEX language_translations_language_id_idx ON public.language_translations USING btree (language_id);


--
-- Name: languages_owner_id_idx; Type: INDEX; Schema: public; Owner: intake24
--

CREATE INDEX languages_owner_id_idx ON public.languages USING btree (owner_id);


--
-- Name: media_collection_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX media_collection_idx ON public.media USING btree (collection);


--
-- Name: media_filename_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX media_filename_idx ON public.media USING btree (filename);


--
-- Name: media_model_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX media_model_id_idx ON public.media USING btree (model_id, model_type);


--
-- Name: media_name_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX media_name_idx ON public.media USING btree (name);


--
-- Name: mfa_authenticators_device_id_idx; Type: INDEX; Schema: public; Owner: intake24
--

CREATE INDEX mfa_authenticators_device_id_idx ON public.mfa_authenticators USING btree (device_id);


--
-- Name: mfa_devices_user_id_idx; Type: INDEX; Schema: public; Owner: intake24
--

CREATE INDEX mfa_devices_user_id_idx ON public.mfa_devices USING btree (user_id);


--
-- Name: missing_foods_survey_id_idx; Type: INDEX; Schema: public; Owner: intake24
--

CREATE INDEX missing_foods_survey_id_idx ON public.missing_foods USING btree (survey_id);


--
-- Name: missing_foods_user_id_idx; Type: INDEX; Schema: public; Owner: intake24
--

CREATE INDEX missing_foods_user_id_idx ON public.missing_foods USING btree (user_id);


--
-- Name: nutrient_types_unit_id_idx; Type: INDEX; Schema: public; Owner: intake24
--

CREATE INDEX nutrient_types_unit_id_idx ON public.nutrient_types USING btree (unit_id);


--
-- Name: personal_access_tokens_user_id_idx; Type: INDEX; Schema: public; Owner: intake24
--

CREATE INDEX personal_access_tokens_user_id_idx ON public.personal_access_tokens USING btree (user_id);


--
-- Name: signin_log_user_id_idx; Type: INDEX; Schema: public; Owner: intake24
--

CREATE INDEX signin_log_user_id_idx ON public.signin_log USING btree (user_id);


--
-- Name: survey_schemes_owner_id_idx; Type: INDEX; Schema: public; Owner: intake24
--

CREATE INDEX survey_schemes_owner_id_idx ON public.survey_schemes USING btree (owner_id);


--
-- Name: survey_submission_custom_fields_survey_submission_id_idx; Type: INDEX; Schema: public; Owner: intake24
--

CREATE INDEX survey_submission_custom_fields_survey_submission_id_idx ON public.survey_submission_custom_fields USING btree (survey_submission_id);


--
-- Name: survey_submission_external_sources_compound_idx; Type: INDEX; Schema: public; Owner: intake24
--

CREATE INDEX survey_submission_external_sources_compound_idx ON public.survey_submission_external_sources USING btree (food_id, food_type);


--
-- Name: survey_submission_external_sources_source_idx; Type: INDEX; Schema: public; Owner: intake24
--

CREATE INDEX survey_submission_external_sources_source_idx ON public.survey_submission_external_sources USING btree (source);


--
-- Name: survey_submission_fields_food_id_idx; Type: INDEX; Schema: public; Owner: intake24
--

CREATE INDEX survey_submission_fields_food_id_idx ON public.survey_submission_fields USING btree (food_id);


--
-- Name: survey_submission_food_custom_fields_food_id_idx; Type: INDEX; Schema: public; Owner: intake24
--

CREATE INDEX survey_submission_food_custom_fields_food_id_idx ON public.survey_submission_food_custom_fields USING btree (food_id);


--
-- Name: survey_submission_foods_index_idx; Type: INDEX; Schema: public; Owner: intake24
--

CREATE INDEX survey_submission_foods_index_idx ON public.survey_submission_foods USING btree (index);


--
-- Name: survey_submission_foods_meal_id_idx; Type: INDEX; Schema: public; Owner: intake24
--

CREATE INDEX survey_submission_foods_meal_id_idx ON public.survey_submission_foods USING btree (meal_id);


--
-- Name: survey_submission_foods_parent_id_idx; Type: INDEX; Schema: public; Owner: intake24
--

CREATE INDEX survey_submission_foods_parent_id_idx ON public.survey_submission_foods USING btree (parent_id);


--
-- Name: survey_submission_meal_custom_fields_meal_id_idx; Type: INDEX; Schema: public; Owner: intake24
--

CREATE INDEX survey_submission_meal_custom_fields_meal_id_idx ON public.survey_submission_meal_custom_fields USING btree (meal_id);


--
-- Name: survey_submission_meals_survey_submission_id_idx; Type: INDEX; Schema: public; Owner: intake24
--

CREATE INDEX survey_submission_meals_survey_submission_id_idx ON public.survey_submission_meals USING btree (survey_submission_id);


--
-- Name: survey_submission_missing_foods_index_idx; Type: INDEX; Schema: public; Owner: intake24
--

CREATE INDEX survey_submission_missing_foods_index_idx ON public.survey_submission_missing_foods USING btree (index);


--
-- Name: survey_submission_missing_foods_meal_id_idx; Type: INDEX; Schema: public; Owner: intake24
--

CREATE INDEX survey_submission_missing_foods_meal_id_idx ON public.survey_submission_missing_foods USING btree (meal_id);


--
-- Name: survey_submission_missing_foods_parent_id_idx; Type: INDEX; Schema: public; Owner: intake24
--

CREATE INDEX survey_submission_missing_foods_parent_id_idx ON public.survey_submission_missing_foods USING btree (parent_id);


--
-- Name: survey_submission_nutrients_food_id_idx; Type: INDEX; Schema: public; Owner: intake24
--

CREATE INDEX survey_submission_nutrients_food_id_idx ON public.survey_submission_nutrients USING btree (food_id);


--
-- Name: survey_submission_nutrients_nutrient_type_id_idx; Type: INDEX; Schema: public; Owner: intake24
--

CREATE INDEX survey_submission_nutrients_nutrient_type_id_idx ON public.survey_submission_nutrients USING btree (nutrient_type_id);


--
-- Name: survey_submission_portion_size_fields_food_id_idx; Type: INDEX; Schema: public; Owner: intake24
--

CREATE INDEX survey_submission_portion_size_fields_food_id_idx ON public.survey_submission_portion_size_fields USING btree (food_id);


--
-- Name: survey_submissions_survey_id_idx; Type: INDEX; Schema: public; Owner: intake24
--

CREATE INDEX survey_submissions_survey_id_idx ON public.survey_submissions USING btree (survey_id);


--
-- Name: survey_submissions_user_id_idx; Type: INDEX; Schema: public; Owner: intake24
--

CREATE INDEX survey_submissions_user_id_idx ON public.survey_submissions USING btree (user_id);


--
-- Name: surveys_faq_id_idx; Type: INDEX; Schema: public; Owner: intake24
--

CREATE INDEX surveys_faq_id_idx ON public.surveys USING btree (faq_id);


--
-- Name: surveys_name_idx; Type: INDEX; Schema: public; Owner: intake24
--

CREATE INDEX surveys_name_idx ON public.surveys USING btree (name);


--
-- Name: surveys_slug_idx; Type: INDEX; Schema: public; Owner: intake24
--

CREATE INDEX surveys_slug_idx ON public.surveys USING btree (slug);


--
-- Name: user_custom_fields_user_id_idx; Type: INDEX; Schema: public; Owner: intake24
--

CREATE INDEX user_custom_fields_user_id_idx ON public.user_custom_fields USING btree (user_id);


--
-- Name: user_notification_schedule_survey_id_idx; Type: INDEX; Schema: public; Owner: intake24
--

CREATE INDEX user_notification_schedule_survey_id_idx ON public.user_notification_schedule USING btree (survey_id);


--
-- Name: user_notification_schedule_user_id_idx; Type: INDEX; Schema: public; Owner: intake24
--

CREATE INDEX user_notification_schedule_user_id_idx ON public.user_notification_schedule USING btree (user_id);


--
-- Name: user_securables_search_idx; Type: INDEX; Schema: public; Owner: intake24
--

CREATE INDEX user_securables_search_idx ON public.user_securables USING btree (user_id, securable_id, securable_type, action);


--
-- Name: user_securables_user_id_idx; Type: INDEX; Schema: public; Owner: intake24
--

CREATE INDEX user_securables_user_id_idx ON public.user_securables USING btree (user_id);


--
-- Name: user_survey_aliases_survey_id_idx; Type: INDEX; Schema: public; Owner: intake24
--

CREATE INDEX user_survey_aliases_survey_id_idx ON public.user_survey_aliases USING btree (survey_id);


--
-- Name: user_survey_aliases_user_id_idx; Type: INDEX; Schema: public; Owner: intake24
--

CREATE INDEX user_survey_aliases_user_id_idx ON public.user_survey_aliases USING btree (user_id);


--
-- Name: user_survey_ratings_submission_id_idx; Type: INDEX; Schema: public; Owner: intake24
--

CREATE INDEX user_survey_ratings_submission_id_idx ON public.user_survey_ratings USING btree (submission_id);


--
-- Name: user_survey_ratings_survey_id_idx; Type: INDEX; Schema: public; Owner: intake24
--

CREATE INDEX user_survey_ratings_survey_id_idx ON public.user_survey_ratings USING btree (survey_id);


--
-- Name: user_survey_ratings_user_id_idx; Type: INDEX; Schema: public; Owner: intake24
--

CREATE INDEX user_survey_ratings_user_id_idx ON public.user_survey_ratings USING btree (user_id);


--
-- Name: users_email_idx; Type: INDEX; Schema: public; Owner: intake24
--

CREATE INDEX users_email_idx ON public.users USING btree (email);


--
-- Name: users_simple_name_idx; Type: INDEX; Schema: public; Owner: intake24
--

CREATE INDEX users_simple_name_idx ON public.users USING btree (simple_name);


--
-- Name: client_error_reports client_error_reports_survey_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.client_error_reports
    ADD CONSTRAINT client_error_reports_survey_id_fk FOREIGN KEY (survey_id) REFERENCES public.surveys(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: client_error_reports client_error_reports_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.client_error_reports
    ADD CONSTRAINT client_error_reports_user_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: external_test_users external_test_users_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.external_test_users
    ADD CONSTRAINT external_test_users_user_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: faqs faqs_owner_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.faqs
    ADD CONSTRAINT faqs_owner_id_fk FOREIGN KEY (owner_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: feedback_schemes feedback_schemes_owner_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.feedback_schemes
    ADD CONSTRAINT feedback_schemes_owner_id_fk FOREIGN KEY (owner_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: fixed_food_ranking fixed_food_ranking_locale_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.fixed_food_ranking
    ADD CONSTRAINT fixed_food_ranking_locale_id_fk FOREIGN KEY (locale_id) REFERENCES public.locales(code) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: gen_user_counters gen_user_counters_survey_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.gen_user_counters
    ADD CONSTRAINT gen_user_counters_survey_id_fk FOREIGN KEY (survey_id) REFERENCES public.surveys(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: jobs jobs_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_user_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: language_translations language_translations_language_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.language_translations
    ADD CONSTRAINT language_translations_language_id_fk FOREIGN KEY (language_id) REFERENCES public.languages(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: languages languages_owner_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.languages
    ADD CONSTRAINT languages_owner_id_fk FOREIGN KEY (owner_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: locales locales_admin_language_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.locales
    ADD CONSTRAINT locales_admin_language_id_fk FOREIGN KEY (admin_language_id) REFERENCES public.languages(code) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: locales locales_respondent_language_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.locales
    ADD CONSTRAINT locales_respondent_language_id_fk FOREIGN KEY (respondent_language_id) REFERENCES public.languages(code) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: mfa_authenticators mfa_authenticators_device_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.mfa_authenticators
    ADD CONSTRAINT mfa_authenticators_device_id_fk FOREIGN KEY (device_id) REFERENCES public.mfa_devices(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: mfa_devices mfa_devices_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.mfa_devices
    ADD CONSTRAINT mfa_devices_user_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: missing_foods missing_foods_survey_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.missing_foods
    ADD CONSTRAINT missing_foods_survey_id_fk FOREIGN KEY (survey_id) REFERENCES public.surveys(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: missing_foods missing_foods_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.missing_foods
    ADD CONSTRAINT missing_foods_user_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: nutrient_types nutrient_types_unit_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.nutrient_types
    ADD CONSTRAINT nutrient_types_unit_id_fk FOREIGN KEY (unit_id) REFERENCES public.nutrient_units(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: permission_role permission_role_permission_id_permissions_fk; Type: FK CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.permission_role
    ADD CONSTRAINT permission_role_permission_id_permissions_fk FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: permission_role permission_role_role_id_roles_fk; Type: FK CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.permission_role
    ADD CONSTRAINT permission_role_role_id_roles_fk FOREIGN KEY (role_id) REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: permission_user permission_user_permission_id_permissions_fk; Type: FK CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.permission_user
    ADD CONSTRAINT permission_user_permission_id_permissions_fk FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: permission_user permission_user_user_id_users_fk; Type: FK CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.permission_user
    ADD CONSTRAINT permission_user_user_id_users_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: personal_access_tokens personal_access_tokens_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.personal_access_tokens
    ADD CONSTRAINT personal_access_tokens_user_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: role_user role_user_role_id_roles_fk; Type: FK CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.role_user
    ADD CONSTRAINT role_user_role_id_roles_fk FOREIGN KEY (role_id) REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: role_user role_user_user_id_users_fk; Type: FK CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.role_user
    ADD CONSTRAINT role_user_user_id_users_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: signin_log signin_log_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.signin_log
    ADD CONSTRAINT signin_log_user_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: survey_schemes survey_schemes_owner_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.survey_schemes
    ADD CONSTRAINT survey_schemes_owner_id_fk FOREIGN KEY (owner_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: survey_submission_custom_fields survey_submission_custom_fields_survey_submission_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.survey_submission_custom_fields
    ADD CONSTRAINT survey_submission_custom_fields_survey_submission_id_fk FOREIGN KEY (survey_submission_id) REFERENCES public.survey_submissions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: survey_submission_fields survey_submission_fields_food_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.survey_submission_fields
    ADD CONSTRAINT survey_submission_fields_food_id_fk FOREIGN KEY (food_id) REFERENCES public.survey_submission_foods(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: survey_submission_food_custom_fields survey_submission_food_custom_fields_food_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.survey_submission_food_custom_fields
    ADD CONSTRAINT survey_submission_food_custom_fields_food_id_fk FOREIGN KEY (food_id) REFERENCES public.survey_submission_foods(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: survey_submission_foods survey_submission_foods_meal_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.survey_submission_foods
    ADD CONSTRAINT survey_submission_foods_meal_id_fk FOREIGN KEY (meal_id) REFERENCES public.survey_submission_meals(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: survey_submission_foods survey_submission_foods_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.survey_submission_foods
    ADD CONSTRAINT survey_submission_foods_parent_id_fk FOREIGN KEY (parent_id) REFERENCES public.survey_submission_foods(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: survey_submission_meal_custom_fields survey_submission_meal_custom_fields_meal_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.survey_submission_meal_custom_fields
    ADD CONSTRAINT survey_submission_meal_custom_fields_meal_id_fk FOREIGN KEY (meal_id) REFERENCES public.survey_submission_meals(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: survey_submission_meals survey_submission_meals_survey_submission_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.survey_submission_meals
    ADD CONSTRAINT survey_submission_meals_survey_submission_id_fk FOREIGN KEY (survey_submission_id) REFERENCES public.survey_submissions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: survey_submission_missing_foods survey_submission_missing_foods_meal_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.survey_submission_missing_foods
    ADD CONSTRAINT survey_submission_missing_foods_meal_id_fk FOREIGN KEY (meal_id) REFERENCES public.survey_submission_meals(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: survey_submission_nutrients survey_submission_nutrients_food_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.survey_submission_nutrients
    ADD CONSTRAINT survey_submission_nutrients_food_id_fk FOREIGN KEY (food_id) REFERENCES public.survey_submission_foods(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: survey_submission_nutrients survey_submission_nutrients_nutrient_type_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.survey_submission_nutrients
    ADD CONSTRAINT survey_submission_nutrients_nutrient_type_id_fk FOREIGN KEY (nutrient_type_id) REFERENCES public.nutrient_types(id);


--
-- Name: survey_submission_portion_size_fields survey_submission_portion_size_fields_food_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.survey_submission_portion_size_fields
    ADD CONSTRAINT survey_submission_portion_size_fields_food_id_fk FOREIGN KEY (food_id) REFERENCES public.survey_submission_foods(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: survey_submissions survey_submissions_survey_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.survey_submissions
    ADD CONSTRAINT survey_submissions_survey_id_fk FOREIGN KEY (survey_id) REFERENCES public.surveys(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: survey_submissions survey_submissions_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.survey_submissions
    ADD CONSTRAINT survey_submissions_user_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: surveys surveys_faq_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.surveys
    ADD CONSTRAINT surveys_faq_id_fk FOREIGN KEY (faq_id) REFERENCES public.faqs(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: surveys surveys_feedback_scheme_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.surveys
    ADD CONSTRAINT surveys_feedback_scheme_id_fk FOREIGN KEY (feedback_scheme_id) REFERENCES public.feedback_schemes(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: surveys surveys_locale_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.surveys
    ADD CONSTRAINT surveys_locale_id_fk FOREIGN KEY (locale_id) REFERENCES public.locales(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: surveys surveys_survey_scheme_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.surveys
    ADD CONSTRAINT surveys_survey_scheme_id_fk FOREIGN KEY (survey_scheme_id) REFERENCES public.survey_schemes(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: surveys_ux_events_settings surveys_ux_events_settings_survey_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.surveys_ux_events_settings
    ADD CONSTRAINT surveys_ux_events_settings_survey_id_fk FOREIGN KEY (survey_id) REFERENCES public.surveys(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_custom_fields user_custom_fields_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.user_custom_fields
    ADD CONSTRAINT user_custom_fields_user_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_notification_schedule user_notification_schedule_survey_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.user_notification_schedule
    ADD CONSTRAINT user_notification_schedule_survey_id_fk FOREIGN KEY (survey_id) REFERENCES public.surveys(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_notification_schedule user_notification_schedule_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.user_notification_schedule
    ADD CONSTRAINT user_notification_schedule_user_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_password_resets user_password_resets_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.user_password_resets
    ADD CONSTRAINT user_password_resets_user_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_passwords user_passwords_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.user_passwords
    ADD CONSTRAINT user_passwords_user_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_physical_data user_physical_data_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.user_physical_data
    ADD CONSTRAINT user_physical_data_user_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE;


--
-- Name: user_securables user_securables_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.user_securables
    ADD CONSTRAINT user_securables_user_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_subscriptions user_subscriptions_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.user_subscriptions
    ADD CONSTRAINT user_subscriptions_user_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_survey_aliases user_survey_aliases_survey_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.user_survey_aliases
    ADD CONSTRAINT user_survey_aliases_survey_id_fk FOREIGN KEY (survey_id) REFERENCES public.surveys(id) ON UPDATE RESTRICT ON DELETE CASCADE;


--
-- Name: user_survey_aliases user_survey_aliases_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.user_survey_aliases
    ADD CONSTRAINT user_survey_aliases_user_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_survey_ratings user_survey_ratings_survey_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.user_survey_ratings
    ADD CONSTRAINT user_survey_ratings_survey_id_fk FOREIGN KEY (survey_id) REFERENCES public.surveys(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_survey_ratings user_survey_ratings_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.user_survey_ratings
    ADD CONSTRAINT user_survey_ratings_user_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_survey_sessions user_survey_sessions_survey_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.user_survey_sessions
    ADD CONSTRAINT user_survey_sessions_survey_id_fk FOREIGN KEY (survey_id) REFERENCES public.surveys(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_survey_sessions user_survey_sessions_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.user_survey_sessions
    ADD CONSTRAINT user_survey_sessions_user_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ux_events ux_events_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: intake24
--

ALTER TABLE ONLY public.ux_events
    ADD CONSTRAINT ux_events_user_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE;


--
-- PostgreSQL database dump complete
--