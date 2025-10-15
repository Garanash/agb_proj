--
-- PostgreSQL database dump
--

\restrict Sx331RDROagOhgohDCXXrM8wRtvfKvAibIEf8yO53JFIFb4HM1xTNgaU1YjLEtD

-- Dumped from database version 15.14
-- Dumped by pg_dump version 15.14

-- Started on 2025-10-15 12:29:17 UTC

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

DROP DATABASE IF EXISTS agb_prod;
--
-- TOC entry 4143 (class 1262 OID 16384)
-- Name: agb_prod; Type: DATABASE; Schema: -; Owner: agb_user
--

CREATE DATABASE agb_prod WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE agb_prod OWNER TO agb_user;

\unrestrict Sx331RDROagOhgohDCXXrM8wRtvfKvAibIEf8yO53JFIFb4HM1xTNgaU1YjLEtD
\connect agb_prod
\restrict Sx331RDROagOhgohDCXXrM8wRtvfKvAibIEf8yO53JFIFb4HM1xTNgaU1YjLEtD

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 311 (class 1259 OID 17184)
-- Name: ai_chat_messages; Type: TABLE; Schema: public; Owner: agb_user
--

CREATE TABLE public.ai_chat_messages (
    id integer NOT NULL,
    session_id integer NOT NULL,
    message_type character varying NOT NULL,
    content text NOT NULL,
    files_data json,
    matching_results json,
    search_query character varying,
    search_type character varying,
    is_processing boolean,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.ai_chat_messages OWNER TO agb_user;

--
-- TOC entry 310 (class 1259 OID 17183)
-- Name: ai_chat_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: agb_user
--

CREATE SEQUENCE public.ai_chat_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.ai_chat_messages_id_seq OWNER TO agb_user;

--
-- TOC entry 4144 (class 0 OID 0)
-- Dependencies: 310
-- Name: ai_chat_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: agb_user
--

ALTER SEQUENCE public.ai_chat_messages_id_seq OWNED BY public.ai_chat_messages.id;


--
-- TOC entry 279 (class 1259 OID 16866)
-- Name: ai_chat_sessions; Type: TABLE; Schema: public; Owner: agb_user
--

CREATE TABLE public.ai_chat_sessions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    title character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


ALTER TABLE public.ai_chat_sessions OWNER TO agb_user;

--
-- TOC entry 278 (class 1259 OID 16865)
-- Name: ai_chat_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: agb_user
--

CREATE SEQUENCE public.ai_chat_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.ai_chat_sessions_id_seq OWNER TO agb_user;

--
-- TOC entry 4145 (class 0 OID 0)
-- Dependencies: 278
-- Name: ai_chat_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: agb_user
--

ALTER SEQUENCE public.ai_chat_sessions_id_seq OWNED BY public.ai_chat_sessions.id;


--
-- TOC entry 309 (class 1259 OID 17163)
-- Name: ai_processing_logs; Type: TABLE; Schema: public; Owner: agb_user
--

CREATE TABLE public.ai_processing_logs (
    id integer NOT NULL,
    user_id integer NOT NULL,
    api_key_id integer,
    request_type character varying NOT NULL,
    file_path character varying,
    input_text text,
    ai_response text,
    processing_time double precision,
    status character varying NOT NULL,
    error_message text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.ai_processing_logs OWNER TO agb_user;

--
-- TOC entry 308 (class 1259 OID 17162)
-- Name: ai_processing_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: agb_user
--

CREATE SEQUENCE public.ai_processing_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.ai_processing_logs_id_seq OWNER TO agb_user;

--
-- TOC entry 4146 (class 0 OID 0)
-- Dependencies: 308
-- Name: ai_processing_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: agb_user
--

ALTER SEQUENCE public.ai_processing_logs_id_seq OWNED BY public.ai_processing_logs.id;


--
-- TOC entry 237 (class 1259 OID 16523)
-- Name: api_key_settings_v3; Type: TABLE; Schema: public; Owner: agb_user
--

CREATE TABLE public.api_key_settings_v3 (
    id integer NOT NULL,
    service_name character varying NOT NULL,
    key_name character varying NOT NULL,
    api_key character varying NOT NULL,
    additional_config json,
    is_active boolean,
    is_default boolean,
    created_by integer NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    last_used timestamp with time zone
);


ALTER TABLE public.api_key_settings_v3 OWNER TO agb_user;

--
-- TOC entry 236 (class 1259 OID 16522)
-- Name: api_key_settings_v3_id_seq; Type: SEQUENCE; Schema: public; Owner: agb_user
--

CREATE SEQUENCE public.api_key_settings_v3_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.api_key_settings_v3_id_seq OWNER TO agb_user;

--
-- TOC entry 4147 (class 0 OID 0)
-- Dependencies: 236
-- Name: api_key_settings_v3_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: agb_user
--

ALTER SEQUENCE public.api_key_settings_v3_id_seq OWNED BY public.api_key_settings_v3.id;


--
-- TOC entry 277 (class 1259 OID 16850)
-- Name: api_keys; Type: TABLE; Schema: public; Owner: agb_user
--

CREATE TABLE public.api_keys (
    id integer NOT NULL,
    name character varying NOT NULL,
    provider character varying NOT NULL,
    key character varying NOT NULL,
    is_active boolean,
    created_at timestamp with time zone DEFAULT now(),
    last_used timestamp with time zone,
    created_by integer NOT NULL
);


ALTER TABLE public.api_keys OWNER TO agb_user;

--
-- TOC entry 276 (class 1259 OID 16849)
-- Name: api_keys_id_seq; Type: SEQUENCE; Schema: public; Owner: agb_user
--

CREATE SEQUENCE public.api_keys_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.api_keys_id_seq OWNER TO agb_user;

--
-- TOC entry 4148 (class 0 OID 0)
-- Dependencies: 276
-- Name: api_keys_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: agb_user
--

ALTER SEQUENCE public.api_keys_id_seq OWNED BY public.api_keys.id;


--
-- TOC entry 229 (class 1259 OID 16475)
-- Name: app_settings; Type: TABLE; Schema: public; Owner: agb_user
--

CREATE TABLE public.app_settings (
    id integer NOT NULL,
    key character varying NOT NULL,
    value text NOT NULL,
    description text,
    is_encrypted boolean,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


ALTER TABLE public.app_settings OWNER TO agb_user;

--
-- TOC entry 228 (class 1259 OID 16474)
-- Name: app_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: agb_user
--

CREATE SEQUENCE public.app_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.app_settings_id_seq OWNER TO agb_user;

--
-- TOC entry 4149 (class 0 OID 0)
-- Dependencies: 228
-- Name: app_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: agb_user
--

ALTER SEQUENCE public.app_settings_id_seq OWNED BY public.app_settings.id;


--
-- TOC entry 273 (class 1259 OID 16811)
-- Name: article_mappings; Type: TABLE; Schema: public; Owner: agb_user
--

CREATE TABLE public.article_mappings (
    id integer NOT NULL,
    contractor_article character varying NOT NULL,
    contractor_description character varying NOT NULL,
    agb_article character varying NOT NULL,
    agb_description character varying NOT NULL,
    bl_article character varying,
    bl_description character varying,
    match_confidence integer,
    packaging_factor integer,
    recalculated_quantity integer,
    unit character varying NOT NULL,
    is_active boolean,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    nomenclature_id integer
);


ALTER TABLE public.article_mappings OWNER TO agb_user;

--
-- TOC entry 272 (class 1259 OID 16810)
-- Name: article_mappings_id_seq; Type: SEQUENCE; Schema: public; Owner: agb_user
--

CREATE SEQUENCE public.article_mappings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.article_mappings_id_seq OWNER TO agb_user;

--
-- TOC entry 4150 (class 0 OID 0)
-- Dependencies: 272
-- Name: article_mappings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: agb_user
--

ALTER SEQUENCE public.article_mappings_id_seq OWNED BY public.article_mappings.id;


--
-- TOC entry 285 (class 1259 OID 16920)
-- Name: article_search_requests; Type: TABLE; Schema: public; Owner: agb_user
--

CREATE TABLE public.article_search_requests (
    id integer NOT NULL,
    user_id integer NOT NULL,
    request_name character varying,
    articles json NOT NULL,
    status character varying,
    total_articles integer,
    found_articles integer,
    total_suppliers integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    completed_at timestamp with time zone
);


ALTER TABLE public.article_search_requests OWNER TO agb_user;

--
-- TOC entry 284 (class 1259 OID 16919)
-- Name: article_search_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: agb_user
--

CREATE SEQUENCE public.article_search_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.article_search_requests_id_seq OWNER TO agb_user;

--
-- TOC entry 4151 (class 0 OID 0)
-- Dependencies: 284
-- Name: article_search_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: agb_user
--

ALTER SEQUENCE public.article_search_requests_id_seq OWNED BY public.article_search_requests.id;


--
-- TOC entry 313 (class 1259 OID 17200)
-- Name: article_search_results; Type: TABLE; Schema: public; Owner: agb_user
--

CREATE TABLE public.article_search_results (
    id integer NOT NULL,
    request_id integer NOT NULL,
    article_code character varying NOT NULL,
    supplier_id integer NOT NULL,
    supplier_article_id integer NOT NULL,
    confidence_score double precision,
    match_type character varying,
    ai_analysis text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.article_search_results OWNER TO agb_user;

--
-- TOC entry 312 (class 1259 OID 17199)
-- Name: article_search_results_id_seq; Type: SEQUENCE; Schema: public; Owner: agb_user
--

CREATE SEQUENCE public.article_search_results_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.article_search_results_id_seq OWNER TO agb_user;

--
-- TOC entry 4152 (class 0 OID 0)
-- Dependencies: 312
-- Name: article_search_results_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: agb_user
--

ALTER SEQUENCE public.article_search_results_id_seq OWNED BY public.article_search_results.id;


--
-- TOC entry 251 (class 1259 OID 16618)
-- Name: backup_logs_v3; Type: TABLE; Schema: public; Owner: agb_user
--

CREATE TABLE public.backup_logs_v3 (
    id integer NOT NULL,
    backup_type character varying(50) NOT NULL,
    status character varying(20) NOT NULL,
    file_path character varying(500),
    file_size bigint,
    duration_seconds integer,
    error_message text,
    created_by integer,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.backup_logs_v3 OWNER TO agb_user;

--
-- TOC entry 250 (class 1259 OID 16617)
-- Name: backup_logs_v3_id_seq; Type: SEQUENCE; Schema: public; Owner: agb_user
--

CREATE SEQUENCE public.backup_logs_v3_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.backup_logs_v3_id_seq OWNER TO agb_user;

--
-- TOC entry 4153 (class 0 OID 0)
-- Dependencies: 250
-- Name: backup_logs_v3_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: agb_user
--

ALTER SEQUENCE public.backup_logs_v3_id_seq OWNED BY public.backup_logs_v3.id;


--
-- TOC entry 263 (class 1259 OID 16718)
-- Name: chat_bots; Type: TABLE; Schema: public; Owner: agb_user
--

CREATE TABLE public.chat_bots (
    id integer NOT NULL,
    name character varying NOT NULL,
    description character varying,
    model_id character varying,
    is_active boolean,
    created_by integer NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.chat_bots OWNER TO agb_user;

--
-- TOC entry 262 (class 1259 OID 16717)
-- Name: chat_bots_id_seq; Type: SEQUENCE; Schema: public; Owner: agb_user
--

CREATE SEQUENCE public.chat_bots_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.chat_bots_id_seq OWNER TO agb_user;

--
-- TOC entry 4154 (class 0 OID 0)
-- Dependencies: 262
-- Name: chat_bots_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: agb_user
--

ALTER SEQUENCE public.chat_bots_id_seq OWNED BY public.chat_bots.id;


--
-- TOC entry 301 (class 1259 OID 17069)
-- Name: chat_folders; Type: TABLE; Schema: public; Owner: agb_user
--

CREATE TABLE public.chat_folders (
    id integer NOT NULL,
    name character varying NOT NULL,
    description character varying,
    user_id integer,
    room_id integer,
    created_by integer NOT NULL,
    order_index integer,
    is_default boolean,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.chat_folders OWNER TO agb_user;

--
-- TOC entry 300 (class 1259 OID 17068)
-- Name: chat_folders_id_seq; Type: SEQUENCE; Schema: public; Owner: agb_user
--

CREATE SEQUENCE public.chat_folders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.chat_folders_id_seq OWNER TO agb_user;

--
-- TOC entry 4155 (class 0 OID 0)
-- Dependencies: 300
-- Name: chat_folders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: agb_user
--

ALTER SEQUENCE public.chat_folders_id_seq OWNED BY public.chat_folders.id;


--
-- TOC entry 297 (class 1259 OID 17019)
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: agb_user
--

CREATE TABLE public.chat_messages (
    id integer NOT NULL,
    room_id integer NOT NULL,
    sender_id integer,
    bot_id integer,
    content character varying NOT NULL,
    is_edited boolean,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


ALTER TABLE public.chat_messages OWNER TO agb_user;

--
-- TOC entry 296 (class 1259 OID 17018)
-- Name: chat_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: agb_user
--

CREATE SEQUENCE public.chat_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.chat_messages_id_seq OWNER TO agb_user;

--
-- TOC entry 4156 (class 0 OID 0)
-- Dependencies: 296
-- Name: chat_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: agb_user
--

ALTER SEQUENCE public.chat_messages_id_seq OWNED BY public.chat_messages.id;


--
-- TOC entry 299 (class 1259 OID 17045)
-- Name: chat_participants; Type: TABLE; Schema: public; Owner: agb_user
--

CREATE TABLE public.chat_participants (
    id integer NOT NULL,
    room_id integer NOT NULL,
    user_id integer,
    bot_id integer,
    is_admin boolean,
    joined_at timestamp with time zone DEFAULT now(),
    last_read_at timestamp with time zone
);


ALTER TABLE public.chat_participants OWNER TO agb_user;

--
-- TOC entry 298 (class 1259 OID 17044)
-- Name: chat_participants_id_seq; Type: SEQUENCE; Schema: public; Owner: agb_user
--

CREATE SEQUENCE public.chat_participants_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.chat_participants_id_seq OWNER TO agb_user;

--
-- TOC entry 4157 (class 0 OID 0)
-- Dependencies: 298
-- Name: chat_participants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: agb_user
--

ALTER SEQUENCE public.chat_participants_id_seq OWNED BY public.chat_participants.id;


--
-- TOC entry 315 (class 1259 OID 17226)
-- Name: chat_room_folders; Type: TABLE; Schema: public; Owner: agb_user
--

CREATE TABLE public.chat_room_folders (
    id integer NOT NULL,
    room_id integer NOT NULL,
    folder_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.chat_room_folders OWNER TO agb_user;

--
-- TOC entry 314 (class 1259 OID 17225)
-- Name: chat_room_folders_id_seq; Type: SEQUENCE; Schema: public; Owner: agb_user
--

CREATE SEQUENCE public.chat_room_folders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.chat_room_folders_id_seq OWNER TO agb_user;

--
-- TOC entry 4158 (class 0 OID 0)
-- Dependencies: 314
-- Name: chat_room_folders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: agb_user
--

ALTER SEQUENCE public.chat_room_folders_id_seq OWNED BY public.chat_room_folders.id;


--
-- TOC entry 261 (class 1259 OID 16702)
-- Name: chat_rooms; Type: TABLE; Schema: public; Owner: agb_user
--

CREATE TABLE public.chat_rooms (
    id integer NOT NULL,
    name character varying NOT NULL,
    description character varying,
    is_private boolean,
    is_active boolean,
    created_by integer NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


ALTER TABLE public.chat_rooms OWNER TO agb_user;

--
-- TOC entry 260 (class 1259 OID 16701)
-- Name: chat_rooms_id_seq; Type: SEQUENCE; Schema: public; Owner: agb_user
--

CREATE SEQUENCE public.chat_rooms_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.chat_rooms_id_seq OWNER TO agb_user;

--
-- TOC entry 4159 (class 0 OID 0)
-- Dependencies: 260
-- Name: chat_rooms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: agb_user
--

ALTER SEQUENCE public.chat_rooms_id_seq OWNED BY public.chat_rooms.id;


--
-- TOC entry 253 (class 1259 OID 16632)
-- Name: company_employees; Type: TABLE; Schema: public; Owner: agb_user
--

CREATE TABLE public.company_employees (
    id integer NOT NULL,
    first_name character varying NOT NULL,
    last_name character varying NOT NULL,
    middle_name character varying,
    "position" character varying NOT NULL,
    department_id integer,
    email character varying,
    phone character varying,
    avatar_url character varying,
    is_active boolean,
    sort_order integer NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


ALTER TABLE public.company_employees OWNER TO agb_user;

--
-- TOC entry 252 (class 1259 OID 16631)
-- Name: company_employees_id_seq; Type: SEQUENCE; Schema: public; Owner: agb_user
--

CREATE SEQUENCE public.company_employees_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.company_employees_id_seq OWNER TO agb_user;

--
-- TOC entry 4160 (class 0 OID 0)
-- Dependencies: 252
-- Name: company_employees_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: agb_user
--

ALTER SEQUENCE public.company_employees_id_seq OWNED BY public.company_employees.id;


--
-- TOC entry 269 (class 1259 OID 16775)
-- Name: contractor_profiles; Type: TABLE; Schema: public; Owner: agb_user
--

CREATE TABLE public.contractor_profiles (
    id integer NOT NULL,
    user_id integer NOT NULL,
    last_name character varying,
    first_name character varying,
    patronymic character varying,
    phone character varying,
    email character varying,
    professional_info json,
    education json,
    bank_name character varying,
    bank_account character varying,
    bank_bik character varying,
    telegram_username character varying,
    website character varying,
    general_description character varying,
    profile_photo_path character varying,
    portfolio_files json,
    document_files json,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


ALTER TABLE public.contractor_profiles OWNER TO agb_user;

--
-- TOC entry 268 (class 1259 OID 16774)
-- Name: contractor_profiles_id_seq; Type: SEQUENCE; Schema: public; Owner: agb_user
--

CREATE SEQUENCE public.contractor_profiles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.contractor_profiles_id_seq OWNER TO agb_user;

--
-- TOC entry 4161 (class 0 OID 0)
-- Dependencies: 268
-- Name: contractor_profiles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: agb_user
--

ALTER SEQUENCE public.contractor_profiles_id_seq OWNED BY public.contractor_profiles.id;


--
-- TOC entry 307 (class 1259 OID 17142)
-- Name: contractor_request_items; Type: TABLE; Schema: public; Owner: agb_user
--

CREATE TABLE public.contractor_request_items (
    id integer NOT NULL,
    request_id integer NOT NULL,
    line_number integer NOT NULL,
    contractor_article character varying NOT NULL,
    description character varying NOT NULL,
    unit character varying NOT NULL,
    quantity integer NOT NULL,
    category character varying,
    matched_nomenclature_id integer,
    agb_article character varying,
    bl_article character varying,
    packaging_factor integer,
    recalculated_quantity integer,
    match_confidence integer,
    match_status character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


ALTER TABLE public.contractor_request_items OWNER TO agb_user;

--
-- TOC entry 306 (class 1259 OID 17141)
-- Name: contractor_request_items_id_seq; Type: SEQUENCE; Schema: public; Owner: agb_user
--

CREATE SEQUENCE public.contractor_request_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.contractor_request_items_id_seq OWNER TO agb_user;

--
-- TOC entry 4162 (class 0 OID 0)
-- Dependencies: 306
-- Name: contractor_request_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: agb_user
--

ALTER SEQUENCE public.contractor_request_items_id_seq OWNED BY public.contractor_request_items.id;


--
-- TOC entry 275 (class 1259 OID 16828)
-- Name: contractor_requests; Type: TABLE; Schema: public; Owner: agb_user
--

CREATE TABLE public.contractor_requests (
    id integer NOT NULL,
    request_number character varying NOT NULL,
    contractor_name character varying NOT NULL,
    request_date timestamp without time zone NOT NULL,
    status character varying,
    total_items integer,
    matched_items integer,
    created_by integer NOT NULL,
    processed_by integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    processed_at timestamp with time zone
);


ALTER TABLE public.contractor_requests OWNER TO agb_user;

--
-- TOC entry 274 (class 1259 OID 16827)
-- Name: contractor_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: agb_user
--

CREATE SEQUENCE public.contractor_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.contractor_requests_id_seq OWNER TO agb_user;

--
-- TOC entry 4163 (class 0 OID 0)
-- Dependencies: 274
-- Name: contractor_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: agb_user
--

ALTER SEQUENCE public.contractor_requests_id_seq OWNED BY public.contractor_requests.id;


--
-- TOC entry 317 (class 1259 OID 17245)
-- Name: contractor_responses; Type: TABLE; Schema: public; Owner: agb_user
--

CREATE TABLE public.contractor_responses (
    id integer NOT NULL,
    request_id integer NOT NULL,
    contractor_id integer NOT NULL,
    proposed_cost integer,
    estimated_days integer,
    comment character varying,
    status character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    reviewed_at timestamp with time zone
);


ALTER TABLE public.contractor_responses OWNER TO agb_user;

--
-- TOC entry 316 (class 1259 OID 17244)
-- Name: contractor_responses_id_seq; Type: SEQUENCE; Schema: public; Owner: agb_user
--

CREATE SEQUENCE public.contractor_responses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.contractor_responses_id_seq OWNER TO agb_user;

--
-- TOC entry 4164 (class 0 OID 0)
-- Dependencies: 316
-- Name: contractor_responses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: agb_user
--

ALTER SEQUENCE public.contractor_responses_id_seq OWNED BY public.contractor_responses.id;


--
-- TOC entry 267 (class 1259 OID 16757)
-- Name: customer_profiles; Type: TABLE; Schema: public; Owner: agb_user
--

CREATE TABLE public.customer_profiles (
    id integer NOT NULL,
    user_id integer NOT NULL,
    company_name character varying NOT NULL,
    contact_person character varying NOT NULL,
    phone character varying NOT NULL,
    email character varying NOT NULL,
    address character varying,
    inn character varying,
    kpp character varying,
    ogrn character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


ALTER TABLE public.customer_profiles OWNER TO agb_user;

--
-- TOC entry 266 (class 1259 OID 16756)
-- Name: customer_profiles_id_seq; Type: SEQUENCE; Schema: public; Owner: agb_user
--

CREATE SEQUENCE public.customer_profiles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.customer_profiles_id_seq OWNER TO agb_user;

--
-- TOC entry 4165 (class 0 OID 0)
-- Dependencies: 266
-- Name: customer_profiles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: agb_user
--

ALTER SEQUENCE public.customer_profiles_id_seq OWNED BY public.customer_profiles.id;


--
-- TOC entry 217 (class 1259 OID 16403)
-- Name: departments; Type: TABLE; Schema: public; Owner: agb_user
--

CREATE TABLE public.departments (
    id integer NOT NULL,
    name character varying NOT NULL,
    description character varying,
    head_id integer,
    is_active boolean,
    sort_order integer NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


ALTER TABLE public.departments OWNER TO agb_user;

--
-- TOC entry 216 (class 1259 OID 16402)
-- Name: departments_id_seq; Type: SEQUENCE; Schema: public; Owner: agb_user
--

CREATE SEQUENCE public.departments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.departments_id_seq OWNER TO agb_user;

--
-- TOC entry 4166 (class 0 OID 0)
-- Dependencies: 216
-- Name: departments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: agb_user
--

ALTER SEQUENCE public.departments_id_seq OWNED BY public.departments.id;


--
-- TOC entry 235 (class 1259 OID 16512)
-- Name: email_settings_v3; Type: TABLE; Schema: public; Owner: agb_user
--

CREATE TABLE public.email_settings_v3 (
    id integer NOT NULL,
    name character varying NOT NULL,
    smtp_server character varying NOT NULL,
    smtp_port integer NOT NULL,
    username character varying NOT NULL,
    password character varying NOT NULL,
    use_tls boolean,
    use_ssl boolean,
    from_email character varying NOT NULL,
    from_name character varying,
    is_active boolean,
    is_default boolean,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


ALTER TABLE public.email_settings_v3 OWNER TO agb_user;

--
-- TOC entry 234 (class 1259 OID 16511)
-- Name: email_settings_v3_id_seq; Type: SEQUENCE; Schema: public; Owner: agb_user
--

CREATE SEQUENCE public.email_settings_v3_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.email_settings_v3_id_seq OWNER TO agb_user;

--
-- TOC entry 4167 (class 0 OID 0)
-- Dependencies: 234
-- Name: email_settings_v3_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: agb_user
--

ALTER SEQUENCE public.email_settings_v3_id_seq OWNED BY public.email_settings_v3.id;


--
-- TOC entry 295 (class 1259 OID 16998)
-- Name: event_participants; Type: TABLE; Schema: public; Owner: agb_user
--

CREATE TABLE public.event_participants (
    id integer NOT NULL,
    event_id integer NOT NULL,
    user_id integer NOT NULL,
    status character varying,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.event_participants OWNER TO agb_user;

--
-- TOC entry 294 (class 1259 OID 16997)
-- Name: event_participants_id_seq; Type: SEQUENCE; Schema: public; Owner: agb_user
--

CREATE SEQUENCE public.event_participants_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.event_participants_id_seq OWNER TO agb_user;

--
-- TOC entry 4168 (class 0 OID 0)
-- Dependencies: 294
-- Name: event_participants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: agb_user
--

ALTER SEQUENCE public.event_participants_id_seq OWNED BY public.event_participants.id;


--
-- TOC entry 255 (class 1259 OID 16648)
-- Name: events; Type: TABLE; Schema: public; Owner: agb_user
--

CREATE TABLE public.events (
    id integer NOT NULL,
    title character varying NOT NULL,
    description character varying,
    event_type character varying NOT NULL,
    start_date timestamp without time zone NOT NULL,
    end_date timestamp without time zone NOT NULL,
    location character varying,
    organizer_id integer NOT NULL,
    is_public boolean,
    is_active boolean,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


ALTER TABLE public.events OWNER TO agb_user;

--
-- TOC entry 254 (class 1259 OID 16647)
-- Name: events_id_seq; Type: SEQUENCE; Schema: public; Owner: agb_user
--

CREATE SEQUENCE public.events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.events_id_seq OWNER TO agb_user;

--
-- TOC entry 4169 (class 0 OID 0)
-- Dependencies: 254
-- Name: events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: agb_user
--

ALTER SEQUENCE public.events_id_seq OWNED BY public.events.id;


--
-- TOC entry 281 (class 1259 OID 16882)
-- Name: found_matches; Type: TABLE; Schema: public; Owner: agb_user
--

CREATE TABLE public.found_matches (
    id integer NOT NULL,
    user_id integer NOT NULL,
    search_name character varying NOT NULL,
    search_article character varying,
    quantity double precision,
    unit character varying,
    matched_name character varying NOT NULL,
    matched_article character varying,
    bl_article character varying,
    article_1c character varying,
    cost double precision,
    confidence double precision NOT NULL,
    match_type character varying NOT NULL,
    is_auto_confirmed boolean,
    is_user_confirmed boolean,
    created_at timestamp with time zone DEFAULT now(),
    confirmed_at timestamp with time zone
);


ALTER TABLE public.found_matches OWNER TO agb_user;

--
-- TOC entry 280 (class 1259 OID 16881)
-- Name: found_matches_id_seq; Type: SEQUENCE; Schema: public; Owner: agb_user
--

CREATE SEQUENCE public.found_matches_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.found_matches_id_seq OWNER TO agb_user;

--
-- TOC entry 4170 (class 0 OID 0)
-- Dependencies: 280
-- Name: found_matches_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: agb_user
--

ALTER SEQUENCE public.found_matches_id_seq OWNED BY public.found_matches.id;


--
-- TOC entry 245 (class 1259 OID 16574)
-- Name: login_logs_v3; Type: TABLE; Schema: public; Owner: agb_user
--

CREATE TABLE public.login_logs_v3 (
    id integer NOT NULL,
    user_id integer NOT NULL,
    username character varying(100) NOT NULL,
    ip_address character varying(45) NOT NULL,
    user_agent text,
    success boolean NOT NULL,
    failure_reason character varying(200),
    session_id character varying(100),
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.login_logs_v3 OWNER TO agb_user;

--
-- TOC entry 244 (class 1259 OID 16573)
-- Name: login_logs_v3_id_seq; Type: SEQUENCE; Schema: public; Owner: agb_user
--

CREATE SEQUENCE public.login_logs_v3_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.login_logs_v3_id_seq OWNER TO agb_user;

--
-- TOC entry 4171 (class 0 OID 0)
-- Dependencies: 244
-- Name: login_logs_v3_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: agb_user
--

ALTER SEQUENCE public.login_logs_v3_id_seq OWNED BY public.login_logs_v3.id;


--
-- TOC entry 227 (class 1259 OID 16463)
-- Name: matching_nomenclatures; Type: TABLE; Schema: public; Owner: agb_user
--

CREATE TABLE public.matching_nomenclatures (
    id integer NOT NULL,
    agb_article character varying NOT NULL,
    name character varying NOT NULL,
    code_1c character varying,
    bl_article character varying,
    packaging double precision,
    unit character varying,
    is_active boolean,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


ALTER TABLE public.matching_nomenclatures OWNER TO agb_user;

--
-- TOC entry 226 (class 1259 OID 16462)
-- Name: matching_nomenclatures_id_seq; Type: SEQUENCE; Schema: public; Owner: agb_user
--

CREATE SEQUENCE public.matching_nomenclatures_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.matching_nomenclatures_id_seq OWNER TO agb_user;

--
-- TOC entry 4172 (class 0 OID 0)
-- Dependencies: 226
-- Name: matching_nomenclatures_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: agb_user
--

ALTER SEQUENCE public.matching_nomenclatures_id_seq OWNED BY public.matching_nomenclatures.id;


--
-- TOC entry 257 (class 1259 OID 16664)
-- Name: news; Type: TABLE; Schema: public; Owner: agb_user
--

CREATE TABLE public.news (
    id integer NOT NULL,
    title character varying NOT NULL,
    content character varying NOT NULL,
    category character varying,
    author_id integer NOT NULL,
    author_name character varying,
    is_published boolean,
    published_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


ALTER TABLE public.news OWNER TO agb_user;

--
-- TOC entry 256 (class 1259 OID 16663)
-- Name: news_id_seq; Type: SEQUENCE; Schema: public; Owner: agb_user
--

CREATE SEQUENCE public.news_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.news_id_seq OWNER TO agb_user;

--
-- TOC entry 4173 (class 0 OID 0)
-- Dependencies: 256
-- Name: news_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: agb_user
--

ALTER SEQUENCE public.news_id_seq OWNED BY public.news.id;


--
-- TOC entry 223 (class 1259 OID 16437)
-- Name: passport_counters; Type: TABLE; Schema: public; Owner: agb_user
--

CREATE TABLE public.passport_counters (
    id integer NOT NULL,
    counter_name character varying NOT NULL,
    current_value integer,
    prefix character varying,
    suffix character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


ALTER TABLE public.passport_counters OWNER TO agb_user;

--
-- TOC entry 222 (class 1259 OID 16436)
-- Name: passport_counters_id_seq; Type: SEQUENCE; Schema: public; Owner: agb_user
--

CREATE SEQUENCE public.passport_counters_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.passport_counters_id_seq OWNER TO agb_user;

--
-- TOC entry 4174 (class 0 OID 0)
-- Dependencies: 222
-- Name: passport_counters_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: agb_user
--

ALTER SEQUENCE public.passport_counters_id_seq OWNED BY public.passport_counters.id;


--
-- TOC entry 305 (class 1259 OID 17116)
-- Name: repair_requests; Type: TABLE; Schema: public; Owner: agb_user
--

CREATE TABLE public.repair_requests (
    id integer NOT NULL,
    customer_id integer NOT NULL,
    title character varying NOT NULL,
    description character varying NOT NULL,
    urgency character varying,
    preferred_date timestamp without time zone,
    address character varying,
    city character varying,
    region character varying,
    equipment_type character varying,
    equipment_brand character varying,
    equipment_model character varying,
    problem_description character varying,
    estimated_cost integer,
    manager_comment character varying,
    final_price integer,
    sent_to_bot_at timestamp with time zone,
    status character varying,
    service_engineer_id integer,
    assigned_contractor_id integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    processed_at timestamp with time zone,
    assigned_at timestamp with time zone,
    completed_at timestamp with time zone
);


ALTER TABLE public.repair_requests OWNER TO agb_user;

--
-- TOC entry 304 (class 1259 OID 17115)
-- Name: repair_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: agb_user
--

CREATE SEQUENCE public.repair_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.repair_requests_id_seq OWNER TO agb_user;

--
-- TOC entry 4175 (class 0 OID 0)
-- Dependencies: 304
-- Name: repair_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: agb_user
--

ALTER SEQUENCE public.repair_requests_id_seq OWNED BY public.repair_requests.id;


--
-- TOC entry 289 (class 1259 OID 16952)
-- Name: role_permissions_v3; Type: TABLE; Schema: public; Owner: agb_user
--

CREATE TABLE public.role_permissions_v3 (
    id integer NOT NULL,
    role_id integer NOT NULL,
    permission character varying NOT NULL,
    granted boolean,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.role_permissions_v3 OWNER TO agb_user;

--
-- TOC entry 288 (class 1259 OID 16951)
-- Name: role_permissions_v3_id_seq; Type: SEQUENCE; Schema: public; Owner: agb_user
--

CREATE SEQUENCE public.role_permissions_v3_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.role_permissions_v3_id_seq OWNER TO agb_user;

--
-- TOC entry 4176 (class 0 OID 0)
-- Dependencies: 288
-- Name: role_permissions_v3_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: agb_user
--

ALTER SEQUENCE public.role_permissions_v3_id_seq OWNED BY public.role_permissions_v3.id;


--
-- TOC entry 233 (class 1259 OID 16500)
-- Name: roles_v3; Type: TABLE; Schema: public; Owner: agb_user
--

CREATE TABLE public.roles_v3 (
    id integer NOT NULL,
    name character varying NOT NULL,
    display_name character varying NOT NULL,
    description text,
    is_system boolean,
    is_active boolean,
    color character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


ALTER TABLE public.roles_v3 OWNER TO agb_user;

--
-- TOC entry 232 (class 1259 OID 16499)
-- Name: roles_v3_id_seq; Type: SEQUENCE; Schema: public; Owner: agb_user
--

CREATE SEQUENCE public.roles_v3_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.roles_v3_id_seq OWNER TO agb_user;

--
-- TOC entry 4177 (class 0 OID 0)
-- Dependencies: 232
-- Name: roles_v3_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: agb_user
--

ALTER SEQUENCE public.roles_v3_id_seq OWNED BY public.roles_v3.id;


--
-- TOC entry 249 (class 1259 OID 16602)
-- Name: security_events_v3; Type: TABLE; Schema: public; Owner: agb_user
--

CREATE TABLE public.security_events_v3 (
    id integer NOT NULL,
    event_type character varying(50) NOT NULL,
    severity character varying(20) NOT NULL,
    description text NOT NULL,
    user_id integer,
    ip_address character varying(45),
    user_agent text,
    additional_data json,
    resolved boolean,
    resolved_by integer,
    resolved_at timestamp without time zone,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.security_events_v3 OWNER TO agb_user;

--
-- TOC entry 248 (class 1259 OID 16601)
-- Name: security_events_v3_id_seq; Type: SEQUENCE; Schema: public; Owner: agb_user
--

CREATE SEQUENCE public.security_events_v3_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.security_events_v3_id_seq OWNER TO agb_user;

--
-- TOC entry 4178 (class 0 OID 0)
-- Dependencies: 248
-- Name: security_events_v3_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: agb_user
--

ALTER SEQUENCE public.security_events_v3_id_seq OWNED BY public.security_events_v3.id;


--
-- TOC entry 283 (class 1259 OID 16898)
-- Name: supplier_articles; Type: TABLE; Schema: public; Owner: agb_user
--

CREATE TABLE public.supplier_articles (
    id integer NOT NULL,
    supplier_id integer NOT NULL,
    article_code character varying NOT NULL,
    article_name character varying NOT NULL,
    description text,
    price double precision,
    currency character varying,
    unit character varying,
    min_order_quantity integer,
    availability character varying,
    agb_article character varying,
    bl_article character varying,
    nomenclature_id integer,
    is_active boolean,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    last_price_update timestamp with time zone
);


ALTER TABLE public.supplier_articles OWNER TO agb_user;

--
-- TOC entry 282 (class 1259 OID 16897)
-- Name: supplier_articles_id_seq; Type: SEQUENCE; Schema: public; Owner: agb_user
--

CREATE SEQUENCE public.supplier_articles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.supplier_articles_id_seq OWNER TO agb_user;

--
-- TOC entry 4179 (class 0 OID 0)
-- Dependencies: 282
-- Name: supplier_articles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: agb_user
--

ALTER SEQUENCE public.supplier_articles_id_seq OWNED BY public.supplier_articles.id;


--
-- TOC entry 287 (class 1259 OID 16936)
-- Name: supplier_validation_logs; Type: TABLE; Schema: public; Owner: agb_user
--

CREATE TABLE public.supplier_validation_logs (
    id integer NOT NULL,
    supplier_id integer NOT NULL,
    validation_type character varying NOT NULL,
    status character varying NOT NULL,
    message text,
    details json,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.supplier_validation_logs OWNER TO agb_user;

--
-- TOC entry 286 (class 1259 OID 16935)
-- Name: supplier_validation_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: agb_user
--

CREATE SEQUENCE public.supplier_validation_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.supplier_validation_logs_id_seq OWNER TO agb_user;

--
-- TOC entry 4180 (class 0 OID 0)
-- Dependencies: 286
-- Name: supplier_validation_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: agb_user
--

ALTER SEQUENCE public.supplier_validation_logs_id_seq OWNED BY public.supplier_validation_logs.id;


--
-- TOC entry 231 (class 1259 OID 16487)
-- Name: suppliers; Type: TABLE; Schema: public; Owner: agb_user
--

CREATE TABLE public.suppliers (
    id integer NOT NULL,
    company_name character varying NOT NULL,
    contact_person character varying,
    email character varying,
    phone character varying,
    website character varying,
    address character varying,
    country character varying,
    city character varying,
    email_validated boolean,
    website_validated boolean,
    whois_data json,
    is_active boolean,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    last_checked timestamp with time zone
);


ALTER TABLE public.suppliers OWNER TO agb_user;

--
-- TOC entry 230 (class 1259 OID 16486)
-- Name: suppliers_id_seq; Type: SEQUENCE; Schema: public; Owner: agb_user
--

CREATE SEQUENCE public.suppliers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.suppliers_id_seq OWNER TO agb_user;

--
-- TOC entry 4181 (class 0 OID 0)
-- Dependencies: 230
-- Name: suppliers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: agb_user
--

ALTER SEQUENCE public.suppliers_id_seq OWNED BY public.suppliers.id;


--
-- TOC entry 243 (class 1259 OID 16559)
-- Name: system_logs_v3; Type: TABLE; Schema: public; Owner: agb_user
--

CREATE TABLE public.system_logs_v3 (
    id integer NOT NULL,
    level character varying(20) NOT NULL,
    message text NOT NULL,
    module character varying(100),
    function character varying(100),
    line_number integer,
    user_id integer,
    ip_address character varying(45),
    user_agent text,
    request_id character varying(100),
    extra_data json,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.system_logs_v3 OWNER TO agb_user;

--
-- TOC entry 242 (class 1259 OID 16558)
-- Name: system_logs_v3_id_seq; Type: SEQUENCE; Schema: public; Owner: agb_user
--

CREATE SEQUENCE public.system_logs_v3_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.system_logs_v3_id_seq OWNER TO agb_user;

--
-- TOC entry 4182 (class 0 OID 0)
-- Dependencies: 242
-- Name: system_logs_v3_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: agb_user
--

ALTER SEQUENCE public.system_logs_v3_id_seq OWNED BY public.system_logs_v3.id;


--
-- TOC entry 247 (class 1259 OID 16589)
-- Name: system_metrics_v3; Type: TABLE; Schema: public; Owner: agb_user
--

CREATE TABLE public.system_metrics_v3 (
    id integer NOT NULL,
    metric_name character varying(100) NOT NULL,
    metric_value double precision NOT NULL,
    metric_unit character varying(20),
    tags json,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.system_metrics_v3 OWNER TO agb_user;

--
-- TOC entry 246 (class 1259 OID 16588)
-- Name: system_metrics_v3_id_seq; Type: SEQUENCE; Schema: public; Owner: agb_user
--

CREATE SEQUENCE public.system_metrics_v3_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.system_metrics_v3_id_seq OWNER TO agb_user;

--
-- TOC entry 4183 (class 0 OID 0)
-- Dependencies: 246
-- Name: system_metrics_v3_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: agb_user
--

ALTER SEQUENCE public.system_metrics_v3_id_seq OWNED BY public.system_metrics_v3.id;


--
-- TOC entry 239 (class 1259 OID 16535)
-- Name: system_notifications_v3; Type: TABLE; Schema: public; Owner: agb_user
--

CREATE TABLE public.system_notifications_v3 (
    id integer NOT NULL,
    title character varying NOT NULL,
    message text NOT NULL,
    notification_type character varying NOT NULL,
    target_users json,
    target_roles json,
    is_read json,
    is_system_wide boolean,
    priority integer,
    expires_at timestamp with time zone,
    created_by integer NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.system_notifications_v3 OWNER TO agb_user;

--
-- TOC entry 238 (class 1259 OID 16534)
-- Name: system_notifications_v3_id_seq; Type: SEQUENCE; Schema: public; Owner: agb_user
--

CREATE SEQUENCE public.system_notifications_v3_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.system_notifications_v3_id_seq OWNER TO agb_user;

--
-- TOC entry 4184 (class 0 OID 0)
-- Dependencies: 238
-- Name: system_notifications_v3_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: agb_user
--

ALTER SEQUENCE public.system_notifications_v3_id_seq OWNED BY public.system_notifications_v3.id;


--
-- TOC entry 241 (class 1259 OID 16546)
-- Name: system_settings_v3; Type: TABLE; Schema: public; Owner: agb_user
--

CREATE TABLE public.system_settings_v3 (
    id integer NOT NULL,
    category character varying NOT NULL,
    key character varying NOT NULL,
    value text,
    data_type character varying NOT NULL,
    is_encrypted boolean,
    is_public boolean,
    description text,
    validation_rules json,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


ALTER TABLE public.system_settings_v3 OWNER TO agb_user;

--
-- TOC entry 240 (class 1259 OID 16545)
-- Name: system_settings_v3_id_seq; Type: SEQUENCE; Schema: public; Owner: agb_user
--

CREATE SEQUENCE public.system_settings_v3_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.system_settings_v3_id_seq OWNER TO agb_user;

--
-- TOC entry 4185 (class 0 OID 0)
-- Dependencies: 240
-- Name: system_settings_v3_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: agb_user
--

ALTER SEQUENCE public.system_settings_v3_id_seq OWNED BY public.system_settings_v3.id;


--
-- TOC entry 259 (class 1259 OID 16681)
-- Name: team_members; Type: TABLE; Schema: public; Owner: agb_user
--

CREATE TABLE public.team_members (
    id integer NOT NULL,
    team_id integer NOT NULL,
    user_id integer NOT NULL,
    role character varying,
    joined_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.team_members OWNER TO agb_user;

--
-- TOC entry 258 (class 1259 OID 16680)
-- Name: team_members_id_seq; Type: SEQUENCE; Schema: public; Owner: agb_user
--

CREATE SEQUENCE public.team_members_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.team_members_id_seq OWNER TO agb_user;

--
-- TOC entry 4186 (class 0 OID 0)
-- Dependencies: 258
-- Name: team_members_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: agb_user
--

ALTER SEQUENCE public.team_members_id_seq OWNED BY public.team_members.id;


--
-- TOC entry 219 (class 1259 OID 16414)
-- Name: teams; Type: TABLE; Schema: public; Owner: agb_user
--

CREATE TABLE public.teams (
    id integer NOT NULL,
    name character varying NOT NULL,
    description character varying,
    project_id integer,
    is_active boolean,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


ALTER TABLE public.teams OWNER TO agb_user;

--
-- TOC entry 218 (class 1259 OID 16413)
-- Name: teams_id_seq; Type: SEQUENCE; Schema: public; Owner: agb_user
--

CREATE SEQUENCE public.teams_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.teams_id_seq OWNER TO agb_user;

--
-- TOC entry 4187 (class 0 OID 0)
-- Dependencies: 218
-- Name: teams_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: agb_user
--

ALTER SEQUENCE public.teams_id_seq OWNED BY public.teams.id;


--
-- TOC entry 225 (class 1259 OID 16450)
-- Name: telegram_bots; Type: TABLE; Schema: public; Owner: agb_user
--

CREATE TABLE public.telegram_bots (
    id integer NOT NULL,
    name character varying NOT NULL,
    token character varying NOT NULL,
    is_active boolean,
    webhook_url character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


ALTER TABLE public.telegram_bots OWNER TO agb_user;

--
-- TOC entry 224 (class 1259 OID 16449)
-- Name: telegram_bots_id_seq; Type: SEQUENCE; Schema: public; Owner: agb_user
--

CREATE SEQUENCE public.telegram_bots_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.telegram_bots_id_seq OWNER TO agb_user;

--
-- TOC entry 4188 (class 0 OID 0)
-- Dependencies: 224
-- Name: telegram_bots_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: agb_user
--

ALTER SEQUENCE public.telegram_bots_id_seq OWNED BY public.telegram_bots.id;


--
-- TOC entry 319 (class 1259 OID 17266)
-- Name: telegram_notifications; Type: TABLE; Schema: public; Owner: agb_user
--

CREATE TABLE public.telegram_notifications (
    id integer NOT NULL,
    telegram_user_id integer NOT NULL,
    message_type character varying NOT NULL,
    message_text character varying NOT NULL,
    message_id bigint,
    chat_id bigint NOT NULL,
    repair_request_id integer,
    is_read boolean,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.telegram_notifications OWNER TO agb_user;

--
-- TOC entry 318 (class 1259 OID 17265)
-- Name: telegram_notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: agb_user
--

CREATE SEQUENCE public.telegram_notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.telegram_notifications_id_seq OWNER TO agb_user;

--
-- TOC entry 4189 (class 0 OID 0)
-- Dependencies: 318
-- Name: telegram_notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: agb_user
--

ALTER SEQUENCE public.telegram_notifications_id_seq OWNED BY public.telegram_notifications.id;


--
-- TOC entry 271 (class 1259 OID 16793)
-- Name: telegram_users; Type: TABLE; Schema: public; Owner: agb_user
--

CREATE TABLE public.telegram_users (
    id integer NOT NULL,
    user_id integer NOT NULL,
    telegram_id bigint NOT NULL,
    username character varying,
    first_name character varying,
    last_name character varying,
    is_bot_user boolean,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


ALTER TABLE public.telegram_users OWNER TO agb_user;

--
-- TOC entry 270 (class 1259 OID 16792)
-- Name: telegram_users_id_seq; Type: SEQUENCE; Schema: public; Owner: agb_user
--

CREATE SEQUENCE public.telegram_users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.telegram_users_id_seq OWNER TO agb_user;

--
-- TOC entry 4190 (class 0 OID 0)
-- Dependencies: 270
-- Name: telegram_users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: agb_user
--

ALTER SEQUENCE public.telegram_users_id_seq OWNED BY public.telegram_users.id;


--
-- TOC entry 293 (class 1259 OID 16982)
-- Name: user_activity_v3; Type: TABLE; Schema: public; Owner: agb_user
--

CREATE TABLE public.user_activity_v3 (
    id integer NOT NULL,
    user_id integer NOT NULL,
    action character varying NOT NULL,
    resource_type character varying,
    resource_id character varying,
    details json,
    ip_address character varying,
    user_agent character varying,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.user_activity_v3 OWNER TO agb_user;

--
-- TOC entry 292 (class 1259 OID 16981)
-- Name: user_activity_v3_id_seq; Type: SEQUENCE; Schema: public; Owner: agb_user
--

CREATE SEQUENCE public.user_activity_v3_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.user_activity_v3_id_seq OWNER TO agb_user;

--
-- TOC entry 4191 (class 0 OID 0)
-- Dependencies: 292
-- Name: user_activity_v3_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: agb_user
--

ALTER SEQUENCE public.user_activity_v3_id_seq OWNED BY public.user_activity_v3.id;


--
-- TOC entry 291 (class 1259 OID 16968)
-- Name: user_roles_v3; Type: TABLE; Schema: public; Owner: agb_user
--

CREATE TABLE public.user_roles_v3 (
    id integer NOT NULL,
    user_id integer NOT NULL,
    role_id integer NOT NULL,
    assigned_by integer,
    assigned_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone,
    is_active boolean
);


ALTER TABLE public.user_roles_v3 OWNER TO agb_user;

--
-- TOC entry 290 (class 1259 OID 16967)
-- Name: user_roles_v3_id_seq; Type: SEQUENCE; Schema: public; Owner: agb_user
--

CREATE SEQUENCE public.user_roles_v3_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.user_roles_v3_id_seq OWNER TO agb_user;

--
-- TOC entry 4192 (class 0 OID 0)
-- Dependencies: 290
-- Name: user_roles_v3_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: agb_user
--

ALTER SEQUENCE public.user_roles_v3_id_seq OWNED BY public.user_roles_v3.id;


--
-- TOC entry 215 (class 1259 OID 16390)
-- Name: users; Type: TABLE; Schema: public; Owner: agb_user
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying NOT NULL,
    email character varying NOT NULL,
    hashed_password character varying NOT NULL,
    first_name character varying,
    last_name character varying,
    middle_name character varying,
    role character varying,
    is_active boolean,
    is_password_changed boolean,
    avatar_url character varying,
    phone character varying,
    department_id integer,
    "position" character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


ALTER TABLE public.users OWNER TO agb_user;

--
-- TOC entry 214 (class 1259 OID 16389)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: agb_user
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO agb_user;

--
-- TOC entry 4193 (class 0 OID 0)
-- Dependencies: 214
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: agb_user
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 221 (class 1259 OID 16425)
-- Name: ved_nomenclature; Type: TABLE; Schema: public; Owner: agb_user
--

CREATE TABLE public.ved_nomenclature (
    id integer NOT NULL,
    code_1c character varying NOT NULL,
    name character varying NOT NULL,
    article character varying NOT NULL,
    matrix character varying NOT NULL,
    drilling_depth character varying,
    height character varying,
    thread character varying,
    product_type character varying NOT NULL,
    is_active boolean,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


ALTER TABLE public.ved_nomenclature OWNER TO agb_user;

--
-- TOC entry 220 (class 1259 OID 16424)
-- Name: ved_nomenclature_id_seq; Type: SEQUENCE; Schema: public; Owner: agb_user
--

CREATE SEQUENCE public.ved_nomenclature_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.ved_nomenclature_id_seq OWNER TO agb_user;

--
-- TOC entry 4194 (class 0 OID 0)
-- Dependencies: 220
-- Name: ved_nomenclature_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: agb_user
--

ALTER SEQUENCE public.ved_nomenclature_id_seq OWNED BY public.ved_nomenclature.id;


--
-- TOC entry 303 (class 1259 OID 17095)
-- Name: ved_passport_roles; Type: TABLE; Schema: public; Owner: agb_user
--

CREATE TABLE public.ved_passport_roles (
    id integer NOT NULL,
    passport_id integer NOT NULL,
    user_id integer NOT NULL,
    role character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.ved_passport_roles OWNER TO agb_user;

--
-- TOC entry 302 (class 1259 OID 17094)
-- Name: ved_passport_roles_id_seq; Type: SEQUENCE; Schema: public; Owner: agb_user
--

CREATE SEQUENCE public.ved_passport_roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.ved_passport_roles_id_seq OWNER TO agb_user;

--
-- TOC entry 4195 (class 0 OID 0)
-- Dependencies: 302
-- Name: ved_passport_roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: agb_user
--

ALTER SEQUENCE public.ved_passport_roles_id_seq OWNED BY public.ved_passport_roles.id;


--
-- TOC entry 265 (class 1259 OID 16734)
-- Name: ved_passports; Type: TABLE; Schema: public; Owner: agb_user
--

CREATE TABLE public.ved_passports (
    id integer NOT NULL,
    passport_number character varying NOT NULL,
    title character varying,
    description character varying,
    status character varying,
    order_number character varying NOT NULL,
    quantity integer,
    created_by integer NOT NULL,
    nomenclature_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


ALTER TABLE public.ved_passports OWNER TO agb_user;

--
-- TOC entry 264 (class 1259 OID 16733)
-- Name: ved_passports_id_seq; Type: SEQUENCE; Schema: public; Owner: agb_user
--

CREATE SEQUENCE public.ved_passports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.ved_passports_id_seq OWNER TO agb_user;

--
-- TOC entry 4196 (class 0 OID 0)
-- Dependencies: 264
-- Name: ved_passports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: agb_user
--

ALTER SEQUENCE public.ved_passports_id_seq OWNED BY public.ved_passports.id;


--
-- TOC entry 3620 (class 2604 OID 17187)
-- Name: ai_chat_messages id; Type: DEFAULT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.ai_chat_messages ALTER COLUMN id SET DEFAULT nextval('public.ai_chat_messages_id_seq'::regclass);


--
-- TOC entry 3588 (class 2604 OID 16869)
-- Name: ai_chat_sessions id; Type: DEFAULT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.ai_chat_sessions ALTER COLUMN id SET DEFAULT nextval('public.ai_chat_sessions_id_seq'::regclass);


--
-- TOC entry 3618 (class 2604 OID 17166)
-- Name: ai_processing_logs id; Type: DEFAULT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.ai_processing_logs ALTER COLUMN id SET DEFAULT nextval('public.ai_processing_logs_id_seq'::regclass);


--
-- TOC entry 3545 (class 2604 OID 16526)
-- Name: api_key_settings_v3 id; Type: DEFAULT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.api_key_settings_v3 ALTER COLUMN id SET DEFAULT nextval('public.api_key_settings_v3_id_seq'::regclass);


--
-- TOC entry 3586 (class 2604 OID 16853)
-- Name: api_keys id; Type: DEFAULT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.api_keys ALTER COLUMN id SET DEFAULT nextval('public.api_keys_id_seq'::regclass);


--
-- TOC entry 3537 (class 2604 OID 16478)
-- Name: app_settings id; Type: DEFAULT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.app_settings ALTER COLUMN id SET DEFAULT nextval('public.app_settings_id_seq'::regclass);


--
-- TOC entry 3582 (class 2604 OID 16814)
-- Name: article_mappings id; Type: DEFAULT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.article_mappings ALTER COLUMN id SET DEFAULT nextval('public.article_mappings_id_seq'::regclass);


--
-- TOC entry 3594 (class 2604 OID 16923)
-- Name: article_search_requests id; Type: DEFAULT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.article_search_requests ALTER COLUMN id SET DEFAULT nextval('public.article_search_requests_id_seq'::regclass);


--
-- TOC entry 3622 (class 2604 OID 17203)
-- Name: article_search_results id; Type: DEFAULT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.article_search_results ALTER COLUMN id SET DEFAULT nextval('public.article_search_results_id_seq'::regclass);


--
-- TOC entry 3559 (class 2604 OID 16621)
-- Name: backup_logs_v3 id; Type: DEFAULT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.backup_logs_v3 ALTER COLUMN id SET DEFAULT nextval('public.backup_logs_v3_id_seq'::regclass);


--
-- TOC entry 3572 (class 2604 OID 16721)
-- Name: chat_bots id; Type: DEFAULT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.chat_bots ALTER COLUMN id SET DEFAULT nextval('public.chat_bots_id_seq'::regclass);


--
-- TOC entry 3610 (class 2604 OID 17072)
-- Name: chat_folders id; Type: DEFAULT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.chat_folders ALTER COLUMN id SET DEFAULT nextval('public.chat_folders_id_seq'::regclass);


--
-- TOC entry 3606 (class 2604 OID 17022)
-- Name: chat_messages id; Type: DEFAULT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.chat_messages ALTER COLUMN id SET DEFAULT nextval('public.chat_messages_id_seq'::regclass);


--
-- TOC entry 3608 (class 2604 OID 17048)
-- Name: chat_participants id; Type: DEFAULT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.chat_participants ALTER COLUMN id SET DEFAULT nextval('public.chat_participants_id_seq'::regclass);


--
-- TOC entry 3624 (class 2604 OID 17229)
-- Name: chat_room_folders id; Type: DEFAULT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.chat_room_folders ALTER COLUMN id SET DEFAULT nextval('public.chat_room_folders_id_seq'::regclass);


--
-- TOC entry 3570 (class 2604 OID 16705)
-- Name: chat_rooms id; Type: DEFAULT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.chat_rooms ALTER COLUMN id SET DEFAULT nextval('public.chat_rooms_id_seq'::regclass);


--
-- TOC entry 3561 (class 2604 OID 16635)
-- Name: company_employees id; Type: DEFAULT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.company_employees ALTER COLUMN id SET DEFAULT nextval('public.company_employees_id_seq'::regclass);


--
-- TOC entry 3578 (class 2604 OID 16778)
-- Name: contractor_profiles id; Type: DEFAULT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.contractor_profiles ALTER COLUMN id SET DEFAULT nextval('public.contractor_profiles_id_seq'::regclass);


--
-- TOC entry 3616 (class 2604 OID 17145)
-- Name: contractor_request_items id; Type: DEFAULT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.contractor_request_items ALTER COLUMN id SET DEFAULT nextval('public.contractor_request_items_id_seq'::regclass);


--
-- TOC entry 3584 (class 2604 OID 16831)
-- Name: contractor_requests id; Type: DEFAULT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.contractor_requests ALTER COLUMN id SET DEFAULT nextval('public.contractor_requests_id_seq'::regclass);


--
-- TOC entry 3626 (class 2604 OID 17248)
-- Name: contractor_responses id; Type: DEFAULT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.contractor_responses ALTER COLUMN id SET DEFAULT nextval('public.contractor_responses_id_seq'::regclass);


--
-- TOC entry 3576 (class 2604 OID 16760)
-- Name: customer_profiles id; Type: DEFAULT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.customer_profiles ALTER COLUMN id SET DEFAULT nextval('public.customer_profiles_id_seq'::regclass);


--
-- TOC entry 3525 (class 2604 OID 16406)
-- Name: departments id; Type: DEFAULT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.departments ALTER COLUMN id SET DEFAULT nextval('public.departments_id_seq'::regclass);


--
-- TOC entry 3543 (class 2604 OID 16515)
-- Name: email_settings_v3 id; Type: DEFAULT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.email_settings_v3 ALTER COLUMN id SET DEFAULT nextval('public.email_settings_v3_id_seq'::regclass);


--
-- TOC entry 3604 (class 2604 OID 17001)
-- Name: event_participants id; Type: DEFAULT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.event_participants ALTER COLUMN id SET DEFAULT nextval('public.event_participants_id_seq'::regclass);


--
-- TOC entry 3563 (class 2604 OID 16651)
-- Name: events id; Type: DEFAULT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.events ALTER COLUMN id SET DEFAULT nextval('public.events_id_seq'::regclass);


--
-- TOC entry 3590 (class 2604 OID 16885)
-- Name: found_matches id; Type: DEFAULT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.found_matches ALTER COLUMN id SET DEFAULT nextval('public.found_matches_id_seq'::regclass);


--
-- TOC entry 3553 (class 2604 OID 16577)
-- Name: login_logs_v3 id; Type: DEFAULT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.login_logs_v3 ALTER COLUMN id SET DEFAULT nextval('public.login_logs_v3_id_seq'::regclass);


--
-- TOC entry 3535 (class 2604 OID 16466)
-- Name: matching_nomenclatures id; Type: DEFAULT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.matching_nomenclatures ALTER COLUMN id SET DEFAULT nextval('public.matching_nomenclatures_id_seq'::regclass);


--
-- TOC entry 3565 (class 2604 OID 16667)
-- Name: news id; Type: DEFAULT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.news ALTER COLUMN id SET DEFAULT nextval('public.news_id_seq'::regclass);


--
-- TOC entry 3531 (class 2604 OID 16440)
-- Name: passport_counters id; Type: DEFAULT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.passport_counters ALTER COLUMN id SET DEFAULT nextval('public.passport_counters_id_seq'::regclass);


--
-- TOC entry 3614 (class 2604 OID 17119)
-- Name: repair_requests id; Type: DEFAULT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.repair_requests ALTER COLUMN id SET DEFAULT nextval('public.repair_requests_id_seq'::regclass);


--
-- TOC entry 3598 (class 2604 OID 16955)
-- Name: role_permissions_v3 id; Type: DEFAULT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.role_permissions_v3 ALTER COLUMN id SET DEFAULT nextval('public.role_permissions_v3_id_seq'::regclass);


--
-- TOC entry 3541 (class 2604 OID 16503)
-- Name: roles_v3 id; Type: DEFAULT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.roles_v3 ALTER COLUMN id SET DEFAULT nextval('public.roles_v3_id_seq'::regclass);


--
-- TOC entry 3557 (class 2604 OID 16605)
-- Name: security_events_v3 id; Type: DEFAULT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.security_events_v3 ALTER COLUMN id SET DEFAULT nextval('public.security_events_v3_id_seq'::regclass);


--
-- TOC entry 3592 (class 2604 OID 16901)
-- Name: supplier_articles id; Type: DEFAULT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.supplier_articles ALTER COLUMN id SET DEFAULT nextval('public.supplier_articles_id_seq'::regclass);


--
-- TOC entry 3596 (class 2604 OID 16939)
-- Name: supplier_validation_logs id; Type: DEFAULT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.supplier_validation_logs ALTER COLUMN id SET DEFAULT nextval('public.supplier_validation_logs_id_seq'::regclass);


--
-- TOC entry 3539 (class 2604 OID 16490)
-- Name: suppliers id; Type: DEFAULT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.suppliers ALTER COLUMN id SET DEFAULT nextval('public.suppliers_id_seq'::regclass);


--
-- TOC entry 3551 (class 2604 OID 16562)
-- Name: system_logs_v3 id; Type: DEFAULT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.system_logs_v3 ALTER COLUMN id SET DEFAULT nextval('public.system_logs_v3_id_seq'::regclass);


--
-- TOC entry 3555 (class 2604 OID 16592)
-- Name: system_metrics_v3 id; Type: DEFAULT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.system_metrics_v3 ALTER COLUMN id SET DEFAULT nextval('public.system_metrics_v3_id_seq'::regclass);


--
-- TOC entry 3547 (class 2604 OID 16538)
-- Name: system_notifications_v3 id; Type: DEFAULT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.system_notifications_v3 ALTER COLUMN id SET DEFAULT nextval('public.system_notifications_v3_id_seq'::regclass);


--
-- TOC entry 3549 (class 2604 OID 16549)
-- Name: system_settings_v3 id; Type: DEFAULT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.system_settings_v3 ALTER COLUMN id SET DEFAULT nextval('public.system_settings_v3_id_seq'::regclass);


--
-- TOC entry 3568 (class 2604 OID 16684)
-- Name: team_members id; Type: DEFAULT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.team_members ALTER COLUMN id SET DEFAULT nextval('public.team_members_id_seq'::regclass);


--
-- TOC entry 3527 (class 2604 OID 16417)
-- Name: teams id; Type: DEFAULT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.teams ALTER COLUMN id SET DEFAULT nextval('public.teams_id_seq'::regclass);


--
-- TOC entry 3533 (class 2604 OID 16453)
-- Name: telegram_bots id; Type: DEFAULT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.telegram_bots ALTER COLUMN id SET DEFAULT nextval('public.telegram_bots_id_seq'::regclass);


--
-- TOC entry 3628 (class 2604 OID 17269)
-- Name: telegram_notifications id; Type: DEFAULT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.telegram_notifications ALTER COLUMN id SET DEFAULT nextval('public.telegram_notifications_id_seq'::regclass);


--
-- TOC entry 3580 (class 2604 OID 16796)
-- Name: telegram_users id; Type: DEFAULT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.telegram_users ALTER COLUMN id SET DEFAULT nextval('public.telegram_users_id_seq'::regclass);


--
-- TOC entry 3602 (class 2604 OID 16985)
-- Name: user_activity_v3 id; Type: DEFAULT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.user_activity_v3 ALTER COLUMN id SET DEFAULT nextval('public.user_activity_v3_id_seq'::regclass);


--
-- TOC entry 3600 (class 2604 OID 16971)
-- Name: user_roles_v3 id; Type: DEFAULT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.user_roles_v3 ALTER COLUMN id SET DEFAULT nextval('public.user_roles_v3_id_seq'::regclass);


--
-- TOC entry 3523 (class 2604 OID 16393)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 3529 (class 2604 OID 16428)
-- Name: ved_nomenclature id; Type: DEFAULT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.ved_nomenclature ALTER COLUMN id SET DEFAULT nextval('public.ved_nomenclature_id_seq'::regclass);


--
-- TOC entry 3612 (class 2604 OID 17098)
-- Name: ved_passport_roles id; Type: DEFAULT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.ved_passport_roles ALTER COLUMN id SET DEFAULT nextval('public.ved_passport_roles_id_seq'::regclass);


--
-- TOC entry 3574 (class 2604 OID 16737)
-- Name: ved_passports id; Type: DEFAULT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.ved_passports ALTER COLUMN id SET DEFAULT nextval('public.ved_passports_id_seq'::regclass);


--
-- TOC entry 4129 (class 0 OID 17184)
-- Dependencies: 311
-- Data for Name: ai_chat_messages; Type: TABLE DATA; Schema: public; Owner: agb_user
--

COPY public.ai_chat_messages (id, session_id, message_type, content, files_data, matching_results, search_query, search_type, is_processing, created_at) FROM stdin;
\.


--
-- TOC entry 4097 (class 0 OID 16866)
-- Dependencies: 279
-- Data for Name: ai_chat_sessions; Type: TABLE DATA; Schema: public; Owner: agb_user
--

COPY public.ai_chat_sessions (id, user_id, title, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4127 (class 0 OID 17163)
-- Dependencies: 309
-- Data for Name: ai_processing_logs; Type: TABLE DATA; Schema: public; Owner: agb_user
--

COPY public.ai_processing_logs (id, user_id, api_key_id, request_type, file_path, input_text, ai_response, processing_time, status, error_message, created_at) FROM stdin;
\.


--
-- TOC entry 4055 (class 0 OID 16523)
-- Dependencies: 237
-- Data for Name: api_key_settings_v3; Type: TABLE DATA; Schema: public; Owner: agb_user
--

COPY public.api_key_settings_v3 (id, service_name, key_name, api_key, additional_config, is_active, is_default, created_by, created_at, updated_at, last_used) FROM stdin;
\.


--
-- TOC entry 4095 (class 0 OID 16850)
-- Dependencies: 277
-- Data for Name: api_keys; Type: TABLE DATA; Schema: public; Owner: agb_user
--

COPY public.api_keys (id, name, provider, key, is_active, created_at, last_used, created_by) FROM stdin;
\.


--
-- TOC entry 4047 (class 0 OID 16475)
-- Dependencies: 229
-- Data for Name: app_settings; Type: TABLE DATA; Schema: public; Owner: agb_user
--

COPY public.app_settings (id, key, value, description, is_encrypted, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4091 (class 0 OID 16811)
-- Dependencies: 273
-- Data for Name: article_mappings; Type: TABLE DATA; Schema: public; Owner: agb_user
--

COPY public.article_mappings (id, contractor_article, contractor_description, agb_article, agb_description, bl_article, bl_description, match_confidence, packaging_factor, recalculated_quantity, unit, is_active, created_at, updated_at, nomenclature_id) FROM stdin;
\.


--
-- TOC entry 4103 (class 0 OID 16920)
-- Dependencies: 285
-- Data for Name: article_search_requests; Type: TABLE DATA; Schema: public; Owner: agb_user
--

COPY public.article_search_requests (id, user_id, request_name, articles, status, total_articles, found_articles, total_suppliers, created_at, updated_at, completed_at) FROM stdin;
\.


--
-- TOC entry 4131 (class 0 OID 17200)
-- Dependencies: 313
-- Data for Name: article_search_results; Type: TABLE DATA; Schema: public; Owner: agb_user
--

COPY public.article_search_results (id, request_id, article_code, supplier_id, supplier_article_id, confidence_score, match_type, ai_analysis, created_at) FROM stdin;
\.


--
-- TOC entry 4069 (class 0 OID 16618)
-- Dependencies: 251
-- Data for Name: backup_logs_v3; Type: TABLE DATA; Schema: public; Owner: agb_user
--

COPY public.backup_logs_v3 (id, backup_type, status, file_path, file_size, duration_seconds, error_message, created_by, created_at) FROM stdin;
\.


--
-- TOC entry 4081 (class 0 OID 16718)
-- Dependencies: 263
-- Data for Name: chat_bots; Type: TABLE DATA; Schema: public; Owner: agb_user
--

COPY public.chat_bots (id, name, description, model_id, is_active, created_by, created_at) FROM stdin;
\.


--
-- TOC entry 4119 (class 0 OID 17069)
-- Dependencies: 301
-- Data for Name: chat_folders; Type: TABLE DATA; Schema: public; Owner: agb_user
--

COPY public.chat_folders (id, name, description, user_id, room_id, created_by, order_index, is_default, created_at) FROM stdin;
\.


--
-- TOC entry 4115 (class 0 OID 17019)
-- Dependencies: 297
-- Data for Name: chat_messages; Type: TABLE DATA; Schema: public; Owner: agb_user
--

COPY public.chat_messages (id, room_id, sender_id, bot_id, content, is_edited, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4117 (class 0 OID 17045)
-- Dependencies: 299
-- Data for Name: chat_participants; Type: TABLE DATA; Schema: public; Owner: agb_user
--

COPY public.chat_participants (id, room_id, user_id, bot_id, is_admin, joined_at, last_read_at) FROM stdin;
\.


--
-- TOC entry 4133 (class 0 OID 17226)
-- Dependencies: 315
-- Data for Name: chat_room_folders; Type: TABLE DATA; Schema: public; Owner: agb_user
--

COPY public.chat_room_folders (id, room_id, folder_id, created_at) FROM stdin;
\.


--
-- TOC entry 4079 (class 0 OID 16702)
-- Dependencies: 261
-- Data for Name: chat_rooms; Type: TABLE DATA; Schema: public; Owner: agb_user
--

COPY public.chat_rooms (id, name, description, is_private, is_active, created_by, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4071 (class 0 OID 16632)
-- Dependencies: 253
-- Data for Name: company_employees; Type: TABLE DATA; Schema: public; Owner: agb_user
--

COPY public.company_employees (id, first_name, last_name, middle_name, "position", department_id, email, phone, avatar_url, is_active, sort_order, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4087 (class 0 OID 16775)
-- Dependencies: 269
-- Data for Name: contractor_profiles; Type: TABLE DATA; Schema: public; Owner: agb_user
--

COPY public.contractor_profiles (id, user_id, last_name, first_name, patronymic, phone, email, professional_info, education, bank_name, bank_account, bank_bik, telegram_username, website, general_description, profile_photo_path, portfolio_files, document_files, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4125 (class 0 OID 17142)
-- Dependencies: 307
-- Data for Name: contractor_request_items; Type: TABLE DATA; Schema: public; Owner: agb_user
--

COPY public.contractor_request_items (id, request_id, line_number, contractor_article, description, unit, quantity, category, matched_nomenclature_id, agb_article, bl_article, packaging_factor, recalculated_quantity, match_confidence, match_status, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4093 (class 0 OID 16828)
-- Dependencies: 275
-- Data for Name: contractor_requests; Type: TABLE DATA; Schema: public; Owner: agb_user
--

COPY public.contractor_requests (id, request_number, contractor_name, request_date, status, total_items, matched_items, created_by, processed_by, created_at, updated_at, processed_at) FROM stdin;
\.


--
-- TOC entry 4135 (class 0 OID 17245)
-- Dependencies: 317
-- Data for Name: contractor_responses; Type: TABLE DATA; Schema: public; Owner: agb_user
--

COPY public.contractor_responses (id, request_id, contractor_id, proposed_cost, estimated_days, comment, status, created_at, updated_at, reviewed_at) FROM stdin;
\.


--
-- TOC entry 4085 (class 0 OID 16757)
-- Dependencies: 267
-- Data for Name: customer_profiles; Type: TABLE DATA; Schema: public; Owner: agb_user
--

COPY public.customer_profiles (id, user_id, company_name, contact_person, phone, email, address, inn, kpp, ogrn, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4035 (class 0 OID 16403)
-- Dependencies: 217
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: agb_user
--

COPY public.departments (id, name, description, head_id, is_active, sort_order, created_at, updated_at) FROM stdin;
1	Администрация	Административный отдел	\N	t	0	2025-10-09 08:17:33.977898+00	\N
\.


--
-- TOC entry 4053 (class 0 OID 16512)
-- Dependencies: 235
-- Data for Name: email_settings_v3; Type: TABLE DATA; Schema: public; Owner: agb_user
--

COPY public.email_settings_v3 (id, name, smtp_server, smtp_port, username, password, use_tls, use_ssl, from_email, from_name, is_active, is_default, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4113 (class 0 OID 16998)
-- Dependencies: 295
-- Data for Name: event_participants; Type: TABLE DATA; Schema: public; Owner: agb_user
--

COPY public.event_participants (id, event_id, user_id, status, created_at) FROM stdin;
\.


--
-- TOC entry 4073 (class 0 OID 16648)
-- Dependencies: 255
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: agb_user
--

COPY public.events (id, title, description, event_type, start_date, end_date, location, organizer_id, is_public, is_active, created_at, updated_at) FROM stdin;
1	Планерка отдела	Еженедельная планерка отдела	meeting	2025-10-10 12:26:07.621652	2025-10-10 13:26:07.621677	\N	1	t	t	2025-10-09 09:26:07.584551+00	\N
2	Техническое совещание	Обсуждение технических вопросов	conference	2025-10-12 12:26:07.621683	2025-10-12 14:26:07.621684	\N	1	t	t	2025-10-09 09:26:07.584551+00	\N
3	Обучение новому оборудованию	Обучение работе с новым оборудованием	briefing	2025-10-16 12:26:07.621687	2025-10-16 16:26:07.621689	\N	1	t	t	2025-10-09 09:26:07.584551+00	\N
\.


--
-- TOC entry 4099 (class 0 OID 16882)
-- Dependencies: 281
-- Data for Name: found_matches; Type: TABLE DATA; Schema: public; Owner: agb_user
--

COPY public.found_matches (id, user_id, search_name, search_article, quantity, unit, matched_name, matched_article, bl_article, article_1c, cost, confidence, match_type, is_auto_confirmed, is_user_confirmed, created_at, confirmed_at) FROM stdin;
\.


--
-- TOC entry 4063 (class 0 OID 16574)
-- Dependencies: 245
-- Data for Name: login_logs_v3; Type: TABLE DATA; Schema: public; Owner: agb_user
--

COPY public.login_logs_v3 (id, user_id, username, ip_address, user_agent, success, failure_reason, session_id, created_at) FROM stdin;
\.


--
-- TOC entry 4045 (class 0 OID 16463)
-- Dependencies: 227
-- Data for Name: matching_nomenclatures; Type: TABLE DATA; Schema: public; Owner: agb_user
--

COPY public.matching_nomenclatures (id, agb_article, name, code_1c, bl_article, packaging, unit, is_active, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4075 (class 0 OID 16664)
-- Dependencies: 257
-- Data for Name: news; Type: TABLE DATA; Schema: public; Owner: agb_user
--

COPY public.news (id, title, content, category, author_id, author_name, is_published, published_at, created_at, updated_at) FROM stdin;
1	Новое оборудование поступило на склад	Сегодня на склад поступило новое оборудование для бурения. Все сотрудники могут ознакомиться с техническими характеристиками.	equipment	1	Иван Петров	t	2025-10-09 09:26:07.584551+00	2025-10-09 09:26:07.584551+00	\N
2	Инструктаж по технике безопасности	Напоминаем всем сотрудникам о необходимости соблюдения техники безопасности на рабочем месте.	safety	1	Мария Сидорова	t	2025-10-09 09:26:07.584551+00	2025-10-09 09:26:07.584551+00	\N
3	Новый проект в разработке	Компания начинает работу над новым проектом бурения. Подробности будут сообщены дополнительно.	projects	1	Алексей Козлов	t	2025-10-09 09:26:07.584551+00	2025-10-09 09:26:07.584551+00	\N
\.


--
-- TOC entry 4041 (class 0 OID 16437)
-- Dependencies: 223
-- Data for Name: passport_counters; Type: TABLE DATA; Schema: public; Owner: agb_user
--

COPY public.passport_counters (id, counter_name, current_value, prefix, suffix, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4123 (class 0 OID 17116)
-- Dependencies: 305
-- Data for Name: repair_requests; Type: TABLE DATA; Schema: public; Owner: agb_user
--

COPY public.repair_requests (id, customer_id, title, description, urgency, preferred_date, address, city, region, equipment_type, equipment_brand, equipment_model, problem_description, estimated_cost, manager_comment, final_price, sent_to_bot_at, status, service_engineer_id, assigned_contractor_id, created_at, updated_at, processed_at, assigned_at, completed_at) FROM stdin;
\.


--
-- TOC entry 4107 (class 0 OID 16952)
-- Dependencies: 289
-- Data for Name: role_permissions_v3; Type: TABLE DATA; Schema: public; Owner: agb_user
--

COPY public.role_permissions_v3 (id, role_id, permission, granted, created_at) FROM stdin;
\.


--
-- TOC entry 4051 (class 0 OID 16500)
-- Dependencies: 233
-- Data for Name: roles_v3; Type: TABLE DATA; Schema: public; Owner: agb_user
--

COPY public.roles_v3 (id, name, display_name, description, is_system, is_active, color, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4067 (class 0 OID 16602)
-- Dependencies: 249
-- Data for Name: security_events_v3; Type: TABLE DATA; Schema: public; Owner: agb_user
--

COPY public.security_events_v3 (id, event_type, severity, description, user_id, ip_address, user_agent, additional_data, resolved, resolved_by, resolved_at, created_at) FROM stdin;
\.


--
-- TOC entry 4101 (class 0 OID 16898)
-- Dependencies: 283
-- Data for Name: supplier_articles; Type: TABLE DATA; Schema: public; Owner: agb_user
--

COPY public.supplier_articles (id, supplier_id, article_code, article_name, description, price, currency, unit, min_order_quantity, availability, agb_article, bl_article, nomenclature_id, is_active, created_at, updated_at, last_price_update) FROM stdin;
\.


--
-- TOC entry 4105 (class 0 OID 16936)
-- Dependencies: 287
-- Data for Name: supplier_validation_logs; Type: TABLE DATA; Schema: public; Owner: agb_user
--

COPY public.supplier_validation_logs (id, supplier_id, validation_type, status, message, details, created_at) FROM stdin;
\.


--
-- TOC entry 4049 (class 0 OID 16487)
-- Dependencies: 231
-- Data for Name: suppliers; Type: TABLE DATA; Schema: public; Owner: agb_user
--

COPY public.suppliers (id, company_name, contact_person, email, phone, website, address, country, city, email_validated, website_validated, whois_data, is_active, created_at, updated_at, last_checked) FROM stdin;
\.


--
-- TOC entry 4061 (class 0 OID 16559)
-- Dependencies: 243
-- Data for Name: system_logs_v3; Type: TABLE DATA; Schema: public; Owner: agb_user
--

COPY public.system_logs_v3 (id, level, message, module, function, line_number, user_id, ip_address, user_agent, request_id, extra_data, created_at) FROM stdin;
\.


--
-- TOC entry 4065 (class 0 OID 16589)
-- Dependencies: 247
-- Data for Name: system_metrics_v3; Type: TABLE DATA; Schema: public; Owner: agb_user
--

COPY public.system_metrics_v3 (id, metric_name, metric_value, metric_unit, tags, created_at) FROM stdin;
\.


--
-- TOC entry 4057 (class 0 OID 16535)
-- Dependencies: 239
-- Data for Name: system_notifications_v3; Type: TABLE DATA; Schema: public; Owner: agb_user
--

COPY public.system_notifications_v3 (id, title, message, notification_type, target_users, target_roles, is_read, is_system_wide, priority, expires_at, created_by, created_at) FROM stdin;
\.


--
-- TOC entry 4059 (class 0 OID 16546)
-- Dependencies: 241
-- Data for Name: system_settings_v3; Type: TABLE DATA; Schema: public; Owner: agb_user
--

COPY public.system_settings_v3 (id, category, key, value, data_type, is_encrypted, is_public, description, validation_rules, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4077 (class 0 OID 16681)
-- Dependencies: 259
-- Data for Name: team_members; Type: TABLE DATA; Schema: public; Owner: agb_user
--

COPY public.team_members (id, team_id, user_id, role, joined_at) FROM stdin;
\.


--
-- TOC entry 4037 (class 0 OID 16414)
-- Dependencies: 219
-- Data for Name: teams; Type: TABLE DATA; Schema: public; Owner: agb_user
--

COPY public.teams (id, name, description, project_id, is_active, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4043 (class 0 OID 16450)
-- Dependencies: 225
-- Data for Name: telegram_bots; Type: TABLE DATA; Schema: public; Owner: agb_user
--

COPY public.telegram_bots (id, name, token, is_active, webhook_url, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4137 (class 0 OID 17266)
-- Dependencies: 319
-- Data for Name: telegram_notifications; Type: TABLE DATA; Schema: public; Owner: agb_user
--

COPY public.telegram_notifications (id, telegram_user_id, message_type, message_text, message_id, chat_id, repair_request_id, is_read, created_at) FROM stdin;
\.


--
-- TOC entry 4089 (class 0 OID 16793)
-- Dependencies: 271
-- Data for Name: telegram_users; Type: TABLE DATA; Schema: public; Owner: agb_user
--

COPY public.telegram_users (id, user_id, telegram_id, username, first_name, last_name, is_bot_user, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4111 (class 0 OID 16982)
-- Dependencies: 293
-- Data for Name: user_activity_v3; Type: TABLE DATA; Schema: public; Owner: agb_user
--

COPY public.user_activity_v3 (id, user_id, action, resource_type, resource_id, details, ip_address, user_agent, created_at) FROM stdin;
\.


--
-- TOC entry 4109 (class 0 OID 16968)
-- Dependencies: 291
-- Data for Name: user_roles_v3; Type: TABLE DATA; Schema: public; Owner: agb_user
--

COPY public.user_roles_v3 (id, user_id, role_id, assigned_by, assigned_at, expires_at, is_active) FROM stdin;
\.


--
-- TOC entry 4033 (class 0 OID 16390)
-- Dependencies: 215
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: agb_user
--

COPY public.users (id, username, email, hashed_password, first_name, last_name, middle_name, role, is_active, is_password_changed, avatar_url, phone, department_id, "position", created_at, updated_at) FROM stdin;
1	admin	admin@almazgeobur.ru	$2b$12$IWbOkpQKTHn8flmqmoLk6.aD4LtfHwHlguN8rCRmHUEtYImaMaKWi	Администратор	Системы		admin	t	f	\N	\N	1	Системный администратор	2025-10-09 08:17:33.987916+00	2025-10-09 13:28:25.904043+00
\.


--
-- TOC entry 4039 (class 0 OID 16425)
-- Dependencies: 221
-- Data for Name: ved_nomenclature; Type: TABLE DATA; Schema: public; Owner: agb_user
--

COPY public.ved_nomenclature (id, code_1c, name, article, matrix, drilling_depth, height, thread, product_type, is_active, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4121 (class 0 OID 17095)
-- Dependencies: 303
-- Data for Name: ved_passport_roles; Type: TABLE DATA; Schema: public; Owner: agb_user
--

COPY public.ved_passport_roles (id, passport_id, user_id, role, created_at) FROM stdin;
\.


--
-- TOC entry 4083 (class 0 OID 16734)
-- Dependencies: 265
-- Data for Name: ved_passports; Type: TABLE DATA; Schema: public; Owner: agb_user
--

COPY public.ved_passports (id, passport_number, title, description, status, order_number, quantity, created_by, nomenclature_id, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4197 (class 0 OID 0)
-- Dependencies: 310
-- Name: ai_chat_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: agb_user
--

SELECT pg_catalog.setval('public.ai_chat_messages_id_seq', 1, false);


--
-- TOC entry 4198 (class 0 OID 0)
-- Dependencies: 278
-- Name: ai_chat_sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: agb_user
--

SELECT pg_catalog.setval('public.ai_chat_sessions_id_seq', 1, false);


--
-- TOC entry 4199 (class 0 OID 0)
-- Dependencies: 308
-- Name: ai_processing_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: agb_user
--

SELECT pg_catalog.setval('public.ai_processing_logs_id_seq', 1, false);


--
-- TOC entry 4200 (class 0 OID 0)
-- Dependencies: 236
-- Name: api_key_settings_v3_id_seq; Type: SEQUENCE SET; Schema: public; Owner: agb_user
--

SELECT pg_catalog.setval('public.api_key_settings_v3_id_seq', 1, false);


--
-- TOC entry 4201 (class 0 OID 0)
-- Dependencies: 276
-- Name: api_keys_id_seq; Type: SEQUENCE SET; Schema: public; Owner: agb_user
--

SELECT pg_catalog.setval('public.api_keys_id_seq', 1, false);


--
-- TOC entry 4202 (class 0 OID 0)
-- Dependencies: 228
-- Name: app_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: agb_user
--

SELECT pg_catalog.setval('public.app_settings_id_seq', 1, false);


--
-- TOC entry 4203 (class 0 OID 0)
-- Dependencies: 272
-- Name: article_mappings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: agb_user
--

SELECT pg_catalog.setval('public.article_mappings_id_seq', 1, false);


--
-- TOC entry 4204 (class 0 OID 0)
-- Dependencies: 284
-- Name: article_search_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: agb_user
--

SELECT pg_catalog.setval('public.article_search_requests_id_seq', 1, false);


--
-- TOC entry 4205 (class 0 OID 0)
-- Dependencies: 312
-- Name: article_search_results_id_seq; Type: SEQUENCE SET; Schema: public; Owner: agb_user
--

SELECT pg_catalog.setval('public.article_search_results_id_seq', 1, false);


--
-- TOC entry 4206 (class 0 OID 0)
-- Dependencies: 250
-- Name: backup_logs_v3_id_seq; Type: SEQUENCE SET; Schema: public; Owner: agb_user
--

SELECT pg_catalog.setval('public.backup_logs_v3_id_seq', 1, false);


--
-- TOC entry 4207 (class 0 OID 0)
-- Dependencies: 262
-- Name: chat_bots_id_seq; Type: SEQUENCE SET; Schema: public; Owner: agb_user
--

SELECT pg_catalog.setval('public.chat_bots_id_seq', 1, false);


--
-- TOC entry 4208 (class 0 OID 0)
-- Dependencies: 300
-- Name: chat_folders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: agb_user
--

SELECT pg_catalog.setval('public.chat_folders_id_seq', 1, false);


--
-- TOC entry 4209 (class 0 OID 0)
-- Dependencies: 296
-- Name: chat_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: agb_user
--

SELECT pg_catalog.setval('public.chat_messages_id_seq', 1, false);


--
-- TOC entry 4210 (class 0 OID 0)
-- Dependencies: 298
-- Name: chat_participants_id_seq; Type: SEQUENCE SET; Schema: public; Owner: agb_user
--

SELECT pg_catalog.setval('public.chat_participants_id_seq', 1, false);


--
-- TOC entry 4211 (class 0 OID 0)
-- Dependencies: 314
-- Name: chat_room_folders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: agb_user
--

SELECT pg_catalog.setval('public.chat_room_folders_id_seq', 1, false);


--
-- TOC entry 4212 (class 0 OID 0)
-- Dependencies: 260
-- Name: chat_rooms_id_seq; Type: SEQUENCE SET; Schema: public; Owner: agb_user
--

SELECT pg_catalog.setval('public.chat_rooms_id_seq', 1, false);


--
-- TOC entry 4213 (class 0 OID 0)
-- Dependencies: 252
-- Name: company_employees_id_seq; Type: SEQUENCE SET; Schema: public; Owner: agb_user
--

SELECT pg_catalog.setval('public.company_employees_id_seq', 1, false);


--
-- TOC entry 4214 (class 0 OID 0)
-- Dependencies: 268
-- Name: contractor_profiles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: agb_user
--

SELECT pg_catalog.setval('public.contractor_profiles_id_seq', 1, false);


--
-- TOC entry 4215 (class 0 OID 0)
-- Dependencies: 306
-- Name: contractor_request_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: agb_user
--

SELECT pg_catalog.setval('public.contractor_request_items_id_seq', 1, false);


--
-- TOC entry 4216 (class 0 OID 0)
-- Dependencies: 274
-- Name: contractor_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: agb_user
--

SELECT pg_catalog.setval('public.contractor_requests_id_seq', 1, false);


--
-- TOC entry 4217 (class 0 OID 0)
-- Dependencies: 316
-- Name: contractor_responses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: agb_user
--

SELECT pg_catalog.setval('public.contractor_responses_id_seq', 1, false);


--
-- TOC entry 4218 (class 0 OID 0)
-- Dependencies: 266
-- Name: customer_profiles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: agb_user
--

SELECT pg_catalog.setval('public.customer_profiles_id_seq', 1, false);


--
-- TOC entry 4219 (class 0 OID 0)
-- Dependencies: 216
-- Name: departments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: agb_user
--

SELECT pg_catalog.setval('public.departments_id_seq', 1, true);


--
-- TOC entry 4220 (class 0 OID 0)
-- Dependencies: 234
-- Name: email_settings_v3_id_seq; Type: SEQUENCE SET; Schema: public; Owner: agb_user
--

SELECT pg_catalog.setval('public.email_settings_v3_id_seq', 1, false);


--
-- TOC entry 4221 (class 0 OID 0)
-- Dependencies: 294
-- Name: event_participants_id_seq; Type: SEQUENCE SET; Schema: public; Owner: agb_user
--

SELECT pg_catalog.setval('public.event_participants_id_seq', 1, false);


--
-- TOC entry 4222 (class 0 OID 0)
-- Dependencies: 254
-- Name: events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: agb_user
--

SELECT pg_catalog.setval('public.events_id_seq', 3, true);


--
-- TOC entry 4223 (class 0 OID 0)
-- Dependencies: 280
-- Name: found_matches_id_seq; Type: SEQUENCE SET; Schema: public; Owner: agb_user
--

SELECT pg_catalog.setval('public.found_matches_id_seq', 1, false);


--
-- TOC entry 4224 (class 0 OID 0)
-- Dependencies: 244
-- Name: login_logs_v3_id_seq; Type: SEQUENCE SET; Schema: public; Owner: agb_user
--

SELECT pg_catalog.setval('public.login_logs_v3_id_seq', 1, false);


--
-- TOC entry 4225 (class 0 OID 0)
-- Dependencies: 226
-- Name: matching_nomenclatures_id_seq; Type: SEQUENCE SET; Schema: public; Owner: agb_user
--

SELECT pg_catalog.setval('public.matching_nomenclatures_id_seq', 1, false);


--
-- TOC entry 4226 (class 0 OID 0)
-- Dependencies: 256
-- Name: news_id_seq; Type: SEQUENCE SET; Schema: public; Owner: agb_user
--

SELECT pg_catalog.setval('public.news_id_seq', 3, true);


--
-- TOC entry 4227 (class 0 OID 0)
-- Dependencies: 222
-- Name: passport_counters_id_seq; Type: SEQUENCE SET; Schema: public; Owner: agb_user
--

SELECT pg_catalog.setval('public.passport_counters_id_seq', 1, false);


--
-- TOC entry 4228 (class 0 OID 0)
-- Dependencies: 304
-- Name: repair_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: agb_user
--

SELECT pg_catalog.setval('public.repair_requests_id_seq', 1, false);


--
-- TOC entry 4229 (class 0 OID 0)
-- Dependencies: 288
-- Name: role_permissions_v3_id_seq; Type: SEQUENCE SET; Schema: public; Owner: agb_user
--

SELECT pg_catalog.setval('public.role_permissions_v3_id_seq', 1, false);


--
-- TOC entry 4230 (class 0 OID 0)
-- Dependencies: 232
-- Name: roles_v3_id_seq; Type: SEQUENCE SET; Schema: public; Owner: agb_user
--

SELECT pg_catalog.setval('public.roles_v3_id_seq', 1, false);


--
-- TOC entry 4231 (class 0 OID 0)
-- Dependencies: 248
-- Name: security_events_v3_id_seq; Type: SEQUENCE SET; Schema: public; Owner: agb_user
--

SELECT pg_catalog.setval('public.security_events_v3_id_seq', 1, false);


--
-- TOC entry 4232 (class 0 OID 0)
-- Dependencies: 282
-- Name: supplier_articles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: agb_user
--

SELECT pg_catalog.setval('public.supplier_articles_id_seq', 1, false);


--
-- TOC entry 4233 (class 0 OID 0)
-- Dependencies: 286
-- Name: supplier_validation_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: agb_user
--

SELECT pg_catalog.setval('public.supplier_validation_logs_id_seq', 1, false);


--
-- TOC entry 4234 (class 0 OID 0)
-- Dependencies: 230
-- Name: suppliers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: agb_user
--

SELECT pg_catalog.setval('public.suppliers_id_seq', 1, false);


--
-- TOC entry 4235 (class 0 OID 0)
-- Dependencies: 242
-- Name: system_logs_v3_id_seq; Type: SEQUENCE SET; Schema: public; Owner: agb_user
--

SELECT pg_catalog.setval('public.system_logs_v3_id_seq', 1, false);


--
-- TOC entry 4236 (class 0 OID 0)
-- Dependencies: 246
-- Name: system_metrics_v3_id_seq; Type: SEQUENCE SET; Schema: public; Owner: agb_user
--

SELECT pg_catalog.setval('public.system_metrics_v3_id_seq', 1, false);


--
-- TOC entry 4237 (class 0 OID 0)
-- Dependencies: 238
-- Name: system_notifications_v3_id_seq; Type: SEQUENCE SET; Schema: public; Owner: agb_user
--

SELECT pg_catalog.setval('public.system_notifications_v3_id_seq', 1, false);


--
-- TOC entry 4238 (class 0 OID 0)
-- Dependencies: 240
-- Name: system_settings_v3_id_seq; Type: SEQUENCE SET; Schema: public; Owner: agb_user
--

SELECT pg_catalog.setval('public.system_settings_v3_id_seq', 1, false);


--
-- TOC entry 4239 (class 0 OID 0)
-- Dependencies: 258
-- Name: team_members_id_seq; Type: SEQUENCE SET; Schema: public; Owner: agb_user
--

SELECT pg_catalog.setval('public.team_members_id_seq', 1, false);


--
-- TOC entry 4240 (class 0 OID 0)
-- Dependencies: 218
-- Name: teams_id_seq; Type: SEQUENCE SET; Schema: public; Owner: agb_user
--

SELECT pg_catalog.setval('public.teams_id_seq', 1, false);


--
-- TOC entry 4241 (class 0 OID 0)
-- Dependencies: 224
-- Name: telegram_bots_id_seq; Type: SEQUENCE SET; Schema: public; Owner: agb_user
--

SELECT pg_catalog.setval('public.telegram_bots_id_seq', 1, false);


--
-- TOC entry 4242 (class 0 OID 0)
-- Dependencies: 318
-- Name: telegram_notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: agb_user
--

SELECT pg_catalog.setval('public.telegram_notifications_id_seq', 1, false);


--
-- TOC entry 4243 (class 0 OID 0)
-- Dependencies: 270
-- Name: telegram_users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: agb_user
--

SELECT pg_catalog.setval('public.telegram_users_id_seq', 1, false);


--
-- TOC entry 4244 (class 0 OID 0)
-- Dependencies: 292
-- Name: user_activity_v3_id_seq; Type: SEQUENCE SET; Schema: public; Owner: agb_user
--

SELECT pg_catalog.setval('public.user_activity_v3_id_seq', 1, false);


--
-- TOC entry 4245 (class 0 OID 0)
-- Dependencies: 290
-- Name: user_roles_v3_id_seq; Type: SEQUENCE SET; Schema: public; Owner: agb_user
--

SELECT pg_catalog.setval('public.user_roles_v3_id_seq', 1, false);


--
-- TOC entry 4246 (class 0 OID 0)
-- Dependencies: 214
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: agb_user
--

SELECT pg_catalog.setval('public.users_id_seq', 2, true);


--
-- TOC entry 4247 (class 0 OID 0)
-- Dependencies: 220
-- Name: ved_nomenclature_id_seq; Type: SEQUENCE SET; Schema: public; Owner: agb_user
--

SELECT pg_catalog.setval('public.ved_nomenclature_id_seq', 1, false);


--
-- TOC entry 4248 (class 0 OID 0)
-- Dependencies: 302
-- Name: ved_passport_roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: agb_user
--

SELECT pg_catalog.setval('public.ved_passport_roles_id_seq', 1, false);


--
-- TOC entry 4249 (class 0 OID 0)
-- Dependencies: 264
-- Name: ved_passports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: agb_user
--

SELECT pg_catalog.setval('public.ved_passports_id_seq', 1, false);


--
-- TOC entry 3819 (class 2606 OID 17192)
-- Name: ai_chat_messages ai_chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.ai_chat_messages
    ADD CONSTRAINT ai_chat_messages_pkey PRIMARY KEY (id);


--
-- TOC entry 3770 (class 2606 OID 16874)
-- Name: ai_chat_sessions ai_chat_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.ai_chat_sessions
    ADD CONSTRAINT ai_chat_sessions_pkey PRIMARY KEY (id);


--
-- TOC entry 3816 (class 2606 OID 17171)
-- Name: ai_processing_logs ai_processing_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.ai_processing_logs
    ADD CONSTRAINT ai_processing_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 3676 (class 2606 OID 16531)
-- Name: api_key_settings_v3 api_key_settings_v3_pkey; Type: CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.api_key_settings_v3
    ADD CONSTRAINT api_key_settings_v3_pkey PRIMARY KEY (id);


--
-- TOC entry 3767 (class 2606 OID 16858)
-- Name: api_keys api_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_pkey PRIMARY KEY (id);


--
-- TOC entry 3660 (class 2606 OID 16483)
-- Name: app_settings app_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.app_settings
    ADD CONSTRAINT app_settings_pkey PRIMARY KEY (id);


--
-- TOC entry 3759 (class 2606 OID 16819)
-- Name: article_mappings article_mappings_pkey; Type: CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.article_mappings
    ADD CONSTRAINT article_mappings_pkey PRIMARY KEY (id);


--
-- TOC entry 3780 (class 2606 OID 16928)
-- Name: article_search_requests article_search_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.article_search_requests
    ADD CONSTRAINT article_search_requests_pkey PRIMARY KEY (id);


--
-- TOC entry 3822 (class 2606 OID 17208)
-- Name: article_search_results article_search_results_pkey; Type: CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.article_search_results
    ADD CONSTRAINT article_search_results_pkey PRIMARY KEY (id);


--
-- TOC entry 3715 (class 2606 OID 16626)
-- Name: backup_logs_v3 backup_logs_v3_pkey; Type: CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.backup_logs_v3
    ADD CONSTRAINT backup_logs_v3_pkey PRIMARY KEY (id);


--
-- TOC entry 3736 (class 2606 OID 16726)
-- Name: chat_bots chat_bots_pkey; Type: CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.chat_bots
    ADD CONSTRAINT chat_bots_pkey PRIMARY KEY (id);


--
-- TOC entry 3804 (class 2606 OID 17077)
-- Name: chat_folders chat_folders_pkey; Type: CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.chat_folders
    ADD CONSTRAINT chat_folders_pkey PRIMARY KEY (id);


--
-- TOC entry 3798 (class 2606 OID 17027)
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- TOC entry 3801 (class 2606 OID 17051)
-- Name: chat_participants chat_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.chat_participants
    ADD CONSTRAINT chat_participants_pkey PRIMARY KEY (id);


--
-- TOC entry 3825 (class 2606 OID 17232)
-- Name: chat_room_folders chat_room_folders_pkey; Type: CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.chat_room_folders
    ADD CONSTRAINT chat_room_folders_pkey PRIMARY KEY (id);


--
-- TOC entry 3733 (class 2606 OID 16710)
-- Name: chat_rooms chat_rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.chat_rooms
    ADD CONSTRAINT chat_rooms_pkey PRIMARY KEY (id);


--
-- TOC entry 3721 (class 2606 OID 16640)
-- Name: company_employees company_employees_pkey; Type: CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.company_employees
    ADD CONSTRAINT company_employees_pkey PRIMARY KEY (id);


--
-- TOC entry 3749 (class 2606 OID 16783)
-- Name: contractor_profiles contractor_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.contractor_profiles
    ADD CONSTRAINT contractor_profiles_pkey PRIMARY KEY (id);


--
-- TOC entry 3751 (class 2606 OID 16785)
-- Name: contractor_profiles contractor_profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.contractor_profiles
    ADD CONSTRAINT contractor_profiles_user_id_key UNIQUE (user_id);


--
-- TOC entry 3813 (class 2606 OID 17150)
-- Name: contractor_request_items contractor_request_items_pkey; Type: CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.contractor_request_items
    ADD CONSTRAINT contractor_request_items_pkey PRIMARY KEY (id);


--
-- TOC entry 3763 (class 2606 OID 16836)
-- Name: contractor_requests contractor_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.contractor_requests
    ADD CONSTRAINT contractor_requests_pkey PRIMARY KEY (id);


--
-- TOC entry 3828 (class 2606 OID 17253)
-- Name: contractor_responses contractor_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.contractor_responses
    ADD CONSTRAINT contractor_responses_pkey PRIMARY KEY (id);


--
-- TOC entry 3744 (class 2606 OID 16765)
-- Name: customer_profiles customer_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.customer_profiles
    ADD CONSTRAINT customer_profiles_pkey PRIMARY KEY (id);


--
-- TOC entry 3746 (class 2606 OID 16767)
-- Name: customer_profiles customer_profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.customer_profiles
    ADD CONSTRAINT customer_profiles_user_id_key UNIQUE (user_id);


--
-- TOC entry 3636 (class 2606 OID 16411)
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- TOC entry 3673 (class 2606 OID 16520)
-- Name: email_settings_v3 email_settings_v3_pkey; Type: CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.email_settings_v3
    ADD CONSTRAINT email_settings_v3_pkey PRIMARY KEY (id);


--
-- TOC entry 3795 (class 2606 OID 17006)
-- Name: event_participants event_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.event_participants
    ADD CONSTRAINT event_participants_pkey PRIMARY KEY (id);


--
-- TOC entry 3724 (class 2606 OID 16656)
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- TOC entry 3773 (class 2606 OID 16890)
-- Name: found_matches found_matches_pkey; Type: CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.found_matches
    ADD CONSTRAINT found_matches_pkey PRIMARY KEY (id);


--
-- TOC entry 3700 (class 2606 OID 16582)
-- Name: login_logs_v3 login_logs_v3_pkey; Type: CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.login_logs_v3
    ADD CONSTRAINT login_logs_v3_pkey PRIMARY KEY (id);


--
-- TOC entry 3658 (class 2606 OID 16471)
-- Name: matching_nomenclatures matching_nomenclatures_pkey; Type: CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.matching_nomenclatures
    ADD CONSTRAINT matching_nomenclatures_pkey PRIMARY KEY (id);


--
-- TOC entry 3728 (class 2606 OID 16673)
-- Name: news news_pkey; Type: CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.news
    ADD CONSTRAINT news_pkey PRIMARY KEY (id);


--
-- TOC entry 3647 (class 2606 OID 16447)
-- Name: passport_counters passport_counters_counter_name_key; Type: CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.passport_counters
    ADD CONSTRAINT passport_counters_counter_name_key UNIQUE (counter_name);


--
-- TOC entry 3649 (class 2606 OID 16445)
-- Name: passport_counters passport_counters_pkey; Type: CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.passport_counters
    ADD CONSTRAINT passport_counters_pkey PRIMARY KEY (id);


--
-- TOC entry 3811 (class 2606 OID 17124)
-- Name: repair_requests repair_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.repair_requests
    ADD CONSTRAINT repair_requests_pkey PRIMARY KEY (id);


--
-- TOC entry 3787 (class 2606 OID 16960)
-- Name: role_permissions_v3 role_permissions_v3_pkey; Type: CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.role_permissions_v3
    ADD CONSTRAINT role_permissions_v3_pkey PRIMARY KEY (id);


--
-- TOC entry 3671 (class 2606 OID 16508)
-- Name: roles_v3 roles_v3_pkey; Type: CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.roles_v3
    ADD CONSTRAINT roles_v3_pkey PRIMARY KEY (id);


--
-- TOC entry 3713 (class 2606 OID 16610)
-- Name: security_events_v3 security_events_v3_pkey; Type: CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.security_events_v3
    ADD CONSTRAINT security_events_v3_pkey PRIMARY KEY (id);


--
-- TOC entry 3778 (class 2606 OID 16906)
-- Name: supplier_articles supplier_articles_pkey; Type: CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.supplier_articles
    ADD CONSTRAINT supplier_articles_pkey PRIMARY KEY (id);


--
-- TOC entry 3784 (class 2606 OID 16944)
-- Name: supplier_validation_logs supplier_validation_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.supplier_validation_logs
    ADD CONSTRAINT supplier_validation_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 3667 (class 2606 OID 16495)
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);


--
-- TOC entry 3693 (class 2606 OID 16567)
-- Name: system_logs_v3 system_logs_v3_pkey; Type: CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.system_logs_v3
    ADD CONSTRAINT system_logs_v3_pkey PRIMARY KEY (id);


--
-- TOC entry 3705 (class 2606 OID 16597)
-- Name: system_metrics_v3 system_metrics_v3_pkey; Type: CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.system_metrics_v3
    ADD CONSTRAINT system_metrics_v3_pkey PRIMARY KEY (id);


--
-- TOC entry 3681 (class 2606 OID 16543)
-- Name: system_notifications_v3 system_notifications_v3_pkey; Type: CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.system_notifications_v3
    ADD CONSTRAINT system_notifications_v3_pkey PRIMARY KEY (id);


--
-- TOC entry 3686 (class 2606 OID 16554)
-- Name: system_settings_v3 system_settings_v3_pkey; Type: CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.system_settings_v3
    ADD CONSTRAINT system_settings_v3_pkey PRIMARY KEY (id);


--
-- TOC entry 3731 (class 2606 OID 16689)
-- Name: team_members team_members_pkey; Type: CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_pkey PRIMARY KEY (id);


--
-- TOC entry 3640 (class 2606 OID 16422)
-- Name: teams teams_pkey; Type: CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_pkey PRIMARY KEY (id);


--
-- TOC entry 3652 (class 2606 OID 16458)
-- Name: telegram_bots telegram_bots_pkey; Type: CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.telegram_bots
    ADD CONSTRAINT telegram_bots_pkey PRIMARY KEY (id);


--
-- TOC entry 3654 (class 2606 OID 16460)
-- Name: telegram_bots telegram_bots_token_key; Type: CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.telegram_bots
    ADD CONSTRAINT telegram_bots_token_key UNIQUE (token);


--
-- TOC entry 3832 (class 2606 OID 17274)
-- Name: telegram_notifications telegram_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.telegram_notifications
    ADD CONSTRAINT telegram_notifications_pkey PRIMARY KEY (id);


--
-- TOC entry 3755 (class 2606 OID 16801)
-- Name: telegram_users telegram_users_pkey; Type: CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.telegram_users
    ADD CONSTRAINT telegram_users_pkey PRIMARY KEY (id);


--
-- TOC entry 3757 (class 2606 OID 16803)
-- Name: telegram_users telegram_users_telegram_id_key; Type: CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.telegram_users
    ADD CONSTRAINT telegram_users_telegram_id_key UNIQUE (telegram_id);


--
-- TOC entry 3793 (class 2606 OID 16990)
-- Name: user_activity_v3 user_activity_v3_pkey; Type: CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.user_activity_v3
    ADD CONSTRAINT user_activity_v3_pkey PRIMARY KEY (id);


--
-- TOC entry 3790 (class 2606 OID 16974)
-- Name: user_roles_v3 user_roles_v3_pkey; Type: CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.user_roles_v3
    ADD CONSTRAINT user_roles_v3_pkey PRIMARY KEY (id);


--
-- TOC entry 3634 (class 2606 OID 16398)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 3644 (class 2606 OID 16433)
-- Name: ved_nomenclature ved_nomenclature_pkey; Type: CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.ved_nomenclature
    ADD CONSTRAINT ved_nomenclature_pkey PRIMARY KEY (id);


--
-- TOC entry 3808 (class 2606 OID 17103)
-- Name: ved_passport_roles ved_passport_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.ved_passport_roles
    ADD CONSTRAINT ved_passport_roles_pkey PRIMARY KEY (id);


--
-- TOC entry 3740 (class 2606 OID 16744)
-- Name: ved_passports ved_passports_passport_number_key; Type: CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.ved_passports
    ADD CONSTRAINT ved_passports_passport_number_key UNIQUE (passport_number);


--
-- TOC entry 3742 (class 2606 OID 16742)
-- Name: ved_passports ved_passports_pkey; Type: CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.ved_passports
    ADD CONSTRAINT ved_passports_pkey PRIMARY KEY (id);


--
-- TOC entry 3820 (class 1259 OID 17198)
-- Name: ix_ai_chat_messages_id; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_ai_chat_messages_id ON public.ai_chat_messages USING btree (id);


--
-- TOC entry 3771 (class 1259 OID 16880)
-- Name: ix_ai_chat_sessions_id; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_ai_chat_sessions_id ON public.ai_chat_sessions USING btree (id);


--
-- TOC entry 3817 (class 1259 OID 17182)
-- Name: ix_ai_processing_logs_id; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_ai_processing_logs_id ON public.ai_processing_logs USING btree (id);


--
-- TOC entry 3677 (class 1259 OID 16532)
-- Name: ix_api_key_settings_v3_id; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_api_key_settings_v3_id ON public.api_key_settings_v3 USING btree (id);


--
-- TOC entry 3678 (class 1259 OID 16533)
-- Name: ix_api_key_settings_v3_service_name; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_api_key_settings_v3_service_name ON public.api_key_settings_v3 USING btree (service_name);


--
-- TOC entry 3768 (class 1259 OID 16864)
-- Name: ix_api_keys_id; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_api_keys_id ON public.api_keys USING btree (id);


--
-- TOC entry 3661 (class 1259 OID 16485)
-- Name: ix_app_settings_id; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_app_settings_id ON public.app_settings USING btree (id);


--
-- TOC entry 3662 (class 1259 OID 16484)
-- Name: ix_app_settings_key; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE UNIQUE INDEX ix_app_settings_key ON public.app_settings USING btree (key);


--
-- TOC entry 3760 (class 1259 OID 16825)
-- Name: ix_article_mappings_contractor_article; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_article_mappings_contractor_article ON public.article_mappings USING btree (contractor_article);


--
-- TOC entry 3761 (class 1259 OID 16826)
-- Name: ix_article_mappings_id; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_article_mappings_id ON public.article_mappings USING btree (id);


--
-- TOC entry 3781 (class 1259 OID 16934)
-- Name: ix_article_search_requests_id; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_article_search_requests_id ON public.article_search_requests USING btree (id);


--
-- TOC entry 3823 (class 1259 OID 17224)
-- Name: ix_article_search_results_id; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_article_search_results_id ON public.article_search_results USING btree (id);


--
-- TOC entry 3716 (class 1259 OID 16628)
-- Name: ix_backup_logs_v3_backup_type; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_backup_logs_v3_backup_type ON public.backup_logs_v3 USING btree (backup_type);


--
-- TOC entry 3717 (class 1259 OID 16627)
-- Name: ix_backup_logs_v3_created_at; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_backup_logs_v3_created_at ON public.backup_logs_v3 USING btree (created_at);


--
-- TOC entry 3718 (class 1259 OID 16630)
-- Name: ix_backup_logs_v3_id; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_backup_logs_v3_id ON public.backup_logs_v3 USING btree (id);


--
-- TOC entry 3719 (class 1259 OID 16629)
-- Name: ix_backup_logs_v3_status; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_backup_logs_v3_status ON public.backup_logs_v3 USING btree (status);


--
-- TOC entry 3737 (class 1259 OID 16732)
-- Name: ix_chat_bots_id; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_chat_bots_id ON public.chat_bots USING btree (id);


--
-- TOC entry 3805 (class 1259 OID 17093)
-- Name: ix_chat_folders_id; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_chat_folders_id ON public.chat_folders USING btree (id);


--
-- TOC entry 3799 (class 1259 OID 17043)
-- Name: ix_chat_messages_id; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_chat_messages_id ON public.chat_messages USING btree (id);


--
-- TOC entry 3802 (class 1259 OID 17067)
-- Name: ix_chat_participants_id; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_chat_participants_id ON public.chat_participants USING btree (id);


--
-- TOC entry 3826 (class 1259 OID 17243)
-- Name: ix_chat_room_folders_id; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_chat_room_folders_id ON public.chat_room_folders USING btree (id);


--
-- TOC entry 3734 (class 1259 OID 16716)
-- Name: ix_chat_rooms_id; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_chat_rooms_id ON public.chat_rooms USING btree (id);


--
-- TOC entry 3722 (class 1259 OID 16646)
-- Name: ix_company_employees_id; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_company_employees_id ON public.company_employees USING btree (id);


--
-- TOC entry 3752 (class 1259 OID 16791)
-- Name: ix_contractor_profiles_id; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_contractor_profiles_id ON public.contractor_profiles USING btree (id);


--
-- TOC entry 3814 (class 1259 OID 17161)
-- Name: ix_contractor_request_items_id; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_contractor_request_items_id ON public.contractor_request_items USING btree (id);


--
-- TOC entry 3764 (class 1259 OID 16847)
-- Name: ix_contractor_requests_id; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_contractor_requests_id ON public.contractor_requests USING btree (id);


--
-- TOC entry 3765 (class 1259 OID 16848)
-- Name: ix_contractor_requests_request_number; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE UNIQUE INDEX ix_contractor_requests_request_number ON public.contractor_requests USING btree (request_number);


--
-- TOC entry 3829 (class 1259 OID 17264)
-- Name: ix_contractor_responses_id; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_contractor_responses_id ON public.contractor_responses USING btree (id);


--
-- TOC entry 3747 (class 1259 OID 16773)
-- Name: ix_customer_profiles_id; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_customer_profiles_id ON public.customer_profiles USING btree (id);


--
-- TOC entry 3637 (class 1259 OID 16412)
-- Name: ix_departments_id; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_departments_id ON public.departments USING btree (id);


--
-- TOC entry 3674 (class 1259 OID 16521)
-- Name: ix_email_settings_v3_id; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_email_settings_v3_id ON public.email_settings_v3 USING btree (id);


--
-- TOC entry 3796 (class 1259 OID 17017)
-- Name: ix_event_participants_id; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_event_participants_id ON public.event_participants USING btree (id);


--
-- TOC entry 3725 (class 1259 OID 16662)
-- Name: ix_events_id; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_events_id ON public.events USING btree (id);


--
-- TOC entry 3774 (class 1259 OID 16896)
-- Name: ix_found_matches_id; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_found_matches_id ON public.found_matches USING btree (id);


--
-- TOC entry 3694 (class 1259 OID 16585)
-- Name: ix_login_logs_v3_created_at; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_login_logs_v3_created_at ON public.login_logs_v3 USING btree (created_at);


--
-- TOC entry 3695 (class 1259 OID 16583)
-- Name: ix_login_logs_v3_id; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_login_logs_v3_id ON public.login_logs_v3 USING btree (id);


--
-- TOC entry 3696 (class 1259 OID 16584)
-- Name: ix_login_logs_v3_session_id; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_login_logs_v3_session_id ON public.login_logs_v3 USING btree (session_id);


--
-- TOC entry 3697 (class 1259 OID 16587)
-- Name: ix_login_logs_v3_success; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_login_logs_v3_success ON public.login_logs_v3 USING btree (success);


--
-- TOC entry 3698 (class 1259 OID 16586)
-- Name: ix_login_logs_v3_user_id; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_login_logs_v3_user_id ON public.login_logs_v3 USING btree (user_id);


--
-- TOC entry 3655 (class 1259 OID 16472)
-- Name: ix_matching_nomenclatures_agb_article; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_matching_nomenclatures_agb_article ON public.matching_nomenclatures USING btree (agb_article);


--
-- TOC entry 3656 (class 1259 OID 16473)
-- Name: ix_matching_nomenclatures_id; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_matching_nomenclatures_id ON public.matching_nomenclatures USING btree (id);


--
-- TOC entry 3726 (class 1259 OID 16679)
-- Name: ix_news_id; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_news_id ON public.news USING btree (id);


--
-- TOC entry 3645 (class 1259 OID 16448)
-- Name: ix_passport_counters_id; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_passport_counters_id ON public.passport_counters USING btree (id);


--
-- TOC entry 3809 (class 1259 OID 17140)
-- Name: ix_repair_requests_id; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_repair_requests_id ON public.repair_requests USING btree (id);


--
-- TOC entry 3785 (class 1259 OID 16966)
-- Name: ix_role_permissions_v3_id; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_role_permissions_v3_id ON public.role_permissions_v3 USING btree (id);


--
-- TOC entry 3668 (class 1259 OID 16510)
-- Name: ix_roles_v3_id; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_roles_v3_id ON public.roles_v3 USING btree (id);


--
-- TOC entry 3669 (class 1259 OID 16509)
-- Name: ix_roles_v3_name; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE UNIQUE INDEX ix_roles_v3_name ON public.roles_v3 USING btree (name);


--
-- TOC entry 3706 (class 1259 OID 16616)
-- Name: ix_security_events_v3_created_at; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_security_events_v3_created_at ON public.security_events_v3 USING btree (created_at);


--
-- TOC entry 3707 (class 1259 OID 16612)
-- Name: ix_security_events_v3_event_type; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_security_events_v3_event_type ON public.security_events_v3 USING btree (event_type);


--
-- TOC entry 3708 (class 1259 OID 16614)
-- Name: ix_security_events_v3_id; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_security_events_v3_id ON public.security_events_v3 USING btree (id);


--
-- TOC entry 3709 (class 1259 OID 16611)
-- Name: ix_security_events_v3_resolved; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_security_events_v3_resolved ON public.security_events_v3 USING btree (resolved);


--
-- TOC entry 3710 (class 1259 OID 16615)
-- Name: ix_security_events_v3_severity; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_security_events_v3_severity ON public.security_events_v3 USING btree (severity);


--
-- TOC entry 3711 (class 1259 OID 16613)
-- Name: ix_security_events_v3_user_id; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_security_events_v3_user_id ON public.security_events_v3 USING btree (user_id);


--
-- TOC entry 3775 (class 1259 OID 16918)
-- Name: ix_supplier_articles_article_code; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_supplier_articles_article_code ON public.supplier_articles USING btree (article_code);


--
-- TOC entry 3776 (class 1259 OID 16917)
-- Name: ix_supplier_articles_id; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_supplier_articles_id ON public.supplier_articles USING btree (id);


--
-- TOC entry 3782 (class 1259 OID 16950)
-- Name: ix_supplier_validation_logs_id; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_supplier_validation_logs_id ON public.supplier_validation_logs USING btree (id);


--
-- TOC entry 3663 (class 1259 OID 16496)
-- Name: ix_suppliers_company_name; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_suppliers_company_name ON public.suppliers USING btree (company_name);


--
-- TOC entry 3664 (class 1259 OID 16498)
-- Name: ix_suppliers_email; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_suppliers_email ON public.suppliers USING btree (email);


--
-- TOC entry 3665 (class 1259 OID 16497)
-- Name: ix_suppliers_id; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_suppliers_id ON public.suppliers USING btree (id);


--
-- TOC entry 3687 (class 1259 OID 16569)
-- Name: ix_system_logs_v3_created_at; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_system_logs_v3_created_at ON public.system_logs_v3 USING btree (created_at);


--
-- TOC entry 3688 (class 1259 OID 16572)
-- Name: ix_system_logs_v3_id; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_system_logs_v3_id ON public.system_logs_v3 USING btree (id);


--
-- TOC entry 3689 (class 1259 OID 16570)
-- Name: ix_system_logs_v3_level; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_system_logs_v3_level ON public.system_logs_v3 USING btree (level);


--
-- TOC entry 3690 (class 1259 OID 16568)
-- Name: ix_system_logs_v3_request_id; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_system_logs_v3_request_id ON public.system_logs_v3 USING btree (request_id);


--
-- TOC entry 3691 (class 1259 OID 16571)
-- Name: ix_system_logs_v3_user_id; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_system_logs_v3_user_id ON public.system_logs_v3 USING btree (user_id);


--
-- TOC entry 3701 (class 1259 OID 16600)
-- Name: ix_system_metrics_v3_created_at; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_system_metrics_v3_created_at ON public.system_metrics_v3 USING btree (created_at);


--
-- TOC entry 3702 (class 1259 OID 16598)
-- Name: ix_system_metrics_v3_id; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_system_metrics_v3_id ON public.system_metrics_v3 USING btree (id);


--
-- TOC entry 3703 (class 1259 OID 16599)
-- Name: ix_system_metrics_v3_metric_name; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_system_metrics_v3_metric_name ON public.system_metrics_v3 USING btree (metric_name);


--
-- TOC entry 3679 (class 1259 OID 16544)
-- Name: ix_system_notifications_v3_id; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_system_notifications_v3_id ON public.system_notifications_v3 USING btree (id);


--
-- TOC entry 3682 (class 1259 OID 16557)
-- Name: ix_system_settings_v3_category; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_system_settings_v3_category ON public.system_settings_v3 USING btree (category);


--
-- TOC entry 3683 (class 1259 OID 16555)
-- Name: ix_system_settings_v3_id; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_system_settings_v3_id ON public.system_settings_v3 USING btree (id);


--
-- TOC entry 3684 (class 1259 OID 16556)
-- Name: ix_system_settings_v3_key; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_system_settings_v3_key ON public.system_settings_v3 USING btree (key);


--
-- TOC entry 3729 (class 1259 OID 16700)
-- Name: ix_team_members_id; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_team_members_id ON public.team_members USING btree (id);


--
-- TOC entry 3638 (class 1259 OID 16423)
-- Name: ix_teams_id; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_teams_id ON public.teams USING btree (id);


--
-- TOC entry 3650 (class 1259 OID 16461)
-- Name: ix_telegram_bots_id; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_telegram_bots_id ON public.telegram_bots USING btree (id);


--
-- TOC entry 3830 (class 1259 OID 17285)
-- Name: ix_telegram_notifications_id; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_telegram_notifications_id ON public.telegram_notifications USING btree (id);


--
-- TOC entry 3753 (class 1259 OID 16809)
-- Name: ix_telegram_users_id; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_telegram_users_id ON public.telegram_users USING btree (id);


--
-- TOC entry 3791 (class 1259 OID 16996)
-- Name: ix_user_activity_v3_id; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_user_activity_v3_id ON public.user_activity_v3 USING btree (id);


--
-- TOC entry 3788 (class 1259 OID 16980)
-- Name: ix_user_roles_v3_id; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_user_roles_v3_id ON public.user_roles_v3 USING btree (id);


--
-- TOC entry 3630 (class 1259 OID 16399)
-- Name: ix_users_email; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE UNIQUE INDEX ix_users_email ON public.users USING btree (email);


--
-- TOC entry 3631 (class 1259 OID 16400)
-- Name: ix_users_id; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_users_id ON public.users USING btree (id);


--
-- TOC entry 3632 (class 1259 OID 16401)
-- Name: ix_users_username; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE UNIQUE INDEX ix_users_username ON public.users USING btree (username);


--
-- TOC entry 3641 (class 1259 OID 16434)
-- Name: ix_ved_nomenclature_code_1c; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE UNIQUE INDEX ix_ved_nomenclature_code_1c ON public.ved_nomenclature USING btree (code_1c);


--
-- TOC entry 3642 (class 1259 OID 16435)
-- Name: ix_ved_nomenclature_id; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_ved_nomenclature_id ON public.ved_nomenclature USING btree (id);


--
-- TOC entry 3806 (class 1259 OID 17114)
-- Name: ix_ved_passport_roles_id; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_ved_passport_roles_id ON public.ved_passport_roles USING btree (id);


--
-- TOC entry 3738 (class 1259 OID 16755)
-- Name: ix_ved_passports_id; Type: INDEX; Schema: public; Owner: agb_user
--

CREATE INDEX ix_ved_passports_id ON public.ved_passports USING btree (id);


--
-- TOC entry 3880 (class 2606 OID 17193)
-- Name: ai_chat_messages ai_chat_messages_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.ai_chat_messages
    ADD CONSTRAINT ai_chat_messages_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.ai_chat_sessions(id);


--
-- TOC entry 3851 (class 2606 OID 16875)
-- Name: ai_chat_sessions ai_chat_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.ai_chat_sessions
    ADD CONSTRAINT ai_chat_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 3878 (class 2606 OID 17177)
-- Name: ai_processing_logs ai_processing_logs_api_key_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.ai_processing_logs
    ADD CONSTRAINT ai_processing_logs_api_key_id_fkey FOREIGN KEY (api_key_id) REFERENCES public.api_keys(id);


--
-- TOC entry 3879 (class 2606 OID 17172)
-- Name: ai_processing_logs ai_processing_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.ai_processing_logs
    ADD CONSTRAINT ai_processing_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 3850 (class 2606 OID 16859)
-- Name: api_keys api_keys_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 3847 (class 2606 OID 16820)
-- Name: article_mappings article_mappings_nomenclature_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.article_mappings
    ADD CONSTRAINT article_mappings_nomenclature_id_fkey FOREIGN KEY (nomenclature_id) REFERENCES public.ved_nomenclature(id);


--
-- TOC entry 3855 (class 2606 OID 16929)
-- Name: article_search_requests article_search_requests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.article_search_requests
    ADD CONSTRAINT article_search_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 3881 (class 2606 OID 17209)
-- Name: article_search_results article_search_results_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.article_search_results
    ADD CONSTRAINT article_search_results_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.article_search_requests(id);


--
-- TOC entry 3882 (class 2606 OID 17219)
-- Name: article_search_results article_search_results_supplier_article_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.article_search_results
    ADD CONSTRAINT article_search_results_supplier_article_id_fkey FOREIGN KEY (supplier_article_id) REFERENCES public.supplier_articles(id);


--
-- TOC entry 3883 (class 2606 OID 17214)
-- Name: article_search_results article_search_results_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.article_search_results
    ADD CONSTRAINT article_search_results_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);


--
-- TOC entry 3841 (class 2606 OID 16727)
-- Name: chat_bots chat_bots_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.chat_bots
    ADD CONSTRAINT chat_bots_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 3868 (class 2606 OID 17088)
-- Name: chat_folders chat_folders_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.chat_folders
    ADD CONSTRAINT chat_folders_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 3869 (class 2606 OID 17083)
-- Name: chat_folders chat_folders_room_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.chat_folders
    ADD CONSTRAINT chat_folders_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.chat_rooms(id);


--
-- TOC entry 3870 (class 2606 OID 17078)
-- Name: chat_folders chat_folders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.chat_folders
    ADD CONSTRAINT chat_folders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 3862 (class 2606 OID 17038)
-- Name: chat_messages chat_messages_bot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_bot_id_fkey FOREIGN KEY (bot_id) REFERENCES public.chat_bots(id);


--
-- TOC entry 3863 (class 2606 OID 17028)
-- Name: chat_messages chat_messages_room_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.chat_rooms(id);


--
-- TOC entry 3864 (class 2606 OID 17033)
-- Name: chat_messages chat_messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id);


--
-- TOC entry 3865 (class 2606 OID 17062)
-- Name: chat_participants chat_participants_bot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.chat_participants
    ADD CONSTRAINT chat_participants_bot_id_fkey FOREIGN KEY (bot_id) REFERENCES public.chat_bots(id);


--
-- TOC entry 3866 (class 2606 OID 17052)
-- Name: chat_participants chat_participants_room_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.chat_participants
    ADD CONSTRAINT chat_participants_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.chat_rooms(id);


--
-- TOC entry 3867 (class 2606 OID 17057)
-- Name: chat_participants chat_participants_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.chat_participants
    ADD CONSTRAINT chat_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 3884 (class 2606 OID 17238)
-- Name: chat_room_folders chat_room_folders_folder_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.chat_room_folders
    ADD CONSTRAINT chat_room_folders_folder_id_fkey FOREIGN KEY (folder_id) REFERENCES public.chat_folders(id);


--
-- TOC entry 3885 (class 2606 OID 17233)
-- Name: chat_room_folders chat_room_folders_room_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.chat_room_folders
    ADD CONSTRAINT chat_room_folders_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.chat_rooms(id);


--
-- TOC entry 3840 (class 2606 OID 16711)
-- Name: chat_rooms chat_rooms_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.chat_rooms
    ADD CONSTRAINT chat_rooms_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 3835 (class 2606 OID 16641)
-- Name: company_employees company_employees_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.company_employees
    ADD CONSTRAINT company_employees_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- TOC entry 3845 (class 2606 OID 16786)
-- Name: contractor_profiles contractor_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.contractor_profiles
    ADD CONSTRAINT contractor_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 3876 (class 2606 OID 17156)
-- Name: contractor_request_items contractor_request_items_matched_nomenclature_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.contractor_request_items
    ADD CONSTRAINT contractor_request_items_matched_nomenclature_id_fkey FOREIGN KEY (matched_nomenclature_id) REFERENCES public.ved_nomenclature(id);


--
-- TOC entry 3877 (class 2606 OID 17151)
-- Name: contractor_request_items contractor_request_items_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.contractor_request_items
    ADD CONSTRAINT contractor_request_items_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.contractor_requests(id);


--
-- TOC entry 3848 (class 2606 OID 16837)
-- Name: contractor_requests contractor_requests_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.contractor_requests
    ADD CONSTRAINT contractor_requests_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 3849 (class 2606 OID 16842)
-- Name: contractor_requests contractor_requests_processed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.contractor_requests
    ADD CONSTRAINT contractor_requests_processed_by_fkey FOREIGN KEY (processed_by) REFERENCES public.users(id);


--
-- TOC entry 3886 (class 2606 OID 17259)
-- Name: contractor_responses contractor_responses_contractor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.contractor_responses
    ADD CONSTRAINT contractor_responses_contractor_id_fkey FOREIGN KEY (contractor_id) REFERENCES public.contractor_profiles(id);


--
-- TOC entry 3887 (class 2606 OID 17254)
-- Name: contractor_responses contractor_responses_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.contractor_responses
    ADD CONSTRAINT contractor_responses_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.repair_requests(id);


--
-- TOC entry 3844 (class 2606 OID 16768)
-- Name: customer_profiles customer_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.customer_profiles
    ADD CONSTRAINT customer_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 3834 (class 2606 OID 17291)
-- Name: departments departments_head_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_head_id_fkey FOREIGN KEY (head_id) REFERENCES public.users(id);


--
-- TOC entry 3860 (class 2606 OID 17007)
-- Name: event_participants event_participants_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.event_participants
    ADD CONSTRAINT event_participants_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id);


--
-- TOC entry 3861 (class 2606 OID 17012)
-- Name: event_participants event_participants_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.event_participants
    ADD CONSTRAINT event_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 3836 (class 2606 OID 16657)
-- Name: events events_organizer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_organizer_id_fkey FOREIGN KEY (organizer_id) REFERENCES public.users(id);


--
-- TOC entry 3852 (class 2606 OID 16891)
-- Name: found_matches found_matches_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.found_matches
    ADD CONSTRAINT found_matches_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 3837 (class 2606 OID 16674)
-- Name: news news_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.news
    ADD CONSTRAINT news_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id);


--
-- TOC entry 3873 (class 2606 OID 17135)
-- Name: repair_requests repair_requests_assigned_contractor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.repair_requests
    ADD CONSTRAINT repair_requests_assigned_contractor_id_fkey FOREIGN KEY (assigned_contractor_id) REFERENCES public.users(id);


--
-- TOC entry 3874 (class 2606 OID 17125)
-- Name: repair_requests repair_requests_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.repair_requests
    ADD CONSTRAINT repair_requests_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customer_profiles(id);


--
-- TOC entry 3875 (class 2606 OID 17130)
-- Name: repair_requests repair_requests_service_engineer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.repair_requests
    ADD CONSTRAINT repair_requests_service_engineer_id_fkey FOREIGN KEY (service_engineer_id) REFERENCES public.users(id);


--
-- TOC entry 3857 (class 2606 OID 16961)
-- Name: role_permissions_v3 role_permissions_v3_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.role_permissions_v3
    ADD CONSTRAINT role_permissions_v3_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles_v3(id);


--
-- TOC entry 3853 (class 2606 OID 16912)
-- Name: supplier_articles supplier_articles_nomenclature_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.supplier_articles
    ADD CONSTRAINT supplier_articles_nomenclature_id_fkey FOREIGN KEY (nomenclature_id) REFERENCES public.ved_nomenclature(id);


--
-- TOC entry 3854 (class 2606 OID 16907)
-- Name: supplier_articles supplier_articles_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.supplier_articles
    ADD CONSTRAINT supplier_articles_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);


--
-- TOC entry 3856 (class 2606 OID 16945)
-- Name: supplier_validation_logs supplier_validation_logs_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.supplier_validation_logs
    ADD CONSTRAINT supplier_validation_logs_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);


--
-- TOC entry 3838 (class 2606 OID 16690)
-- Name: team_members team_members_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id);


--
-- TOC entry 3839 (class 2606 OID 16695)
-- Name: team_members team_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 3888 (class 2606 OID 17280)
-- Name: telegram_notifications telegram_notifications_repair_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.telegram_notifications
    ADD CONSTRAINT telegram_notifications_repair_request_id_fkey FOREIGN KEY (repair_request_id) REFERENCES public.repair_requests(id);


--
-- TOC entry 3889 (class 2606 OID 17275)
-- Name: telegram_notifications telegram_notifications_telegram_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.telegram_notifications
    ADD CONSTRAINT telegram_notifications_telegram_user_id_fkey FOREIGN KEY (telegram_user_id) REFERENCES public.telegram_users(id);


--
-- TOC entry 3846 (class 2606 OID 16804)
-- Name: telegram_users telegram_users_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.telegram_users
    ADD CONSTRAINT telegram_users_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 3859 (class 2606 OID 16991)
-- Name: user_activity_v3 user_activity_v3_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.user_activity_v3
    ADD CONSTRAINT user_activity_v3_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 3858 (class 2606 OID 16975)
-- Name: user_roles_v3 user_roles_v3_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.user_roles_v3
    ADD CONSTRAINT user_roles_v3_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles_v3(id);


--
-- TOC entry 3833 (class 2606 OID 17286)
-- Name: users users_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- TOC entry 3871 (class 2606 OID 17104)
-- Name: ved_passport_roles ved_passport_roles_passport_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.ved_passport_roles
    ADD CONSTRAINT ved_passport_roles_passport_id_fkey FOREIGN KEY (passport_id) REFERENCES public.ved_passports(id);


--
-- TOC entry 3872 (class 2606 OID 17109)
-- Name: ved_passport_roles ved_passport_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.ved_passport_roles
    ADD CONSTRAINT ved_passport_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 3842 (class 2606 OID 16745)
-- Name: ved_passports ved_passports_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.ved_passports
    ADD CONSTRAINT ved_passports_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 3843 (class 2606 OID 16750)
-- Name: ved_passports ved_passports_nomenclature_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: agb_user
--

ALTER TABLE ONLY public.ved_passports
    ADD CONSTRAINT ved_passports_nomenclature_id_fkey FOREIGN KEY (nomenclature_id) REFERENCES public.ved_nomenclature(id);


-- Completed on 2025-10-15 12:29:17 UTC

--
-- PostgreSQL database dump complete
--

\unrestrict Sx331RDROagOhgohDCXXrM8wRtvfKvAibIEf8yO53JFIFb4HM1xTNgaU1YjLEtD

