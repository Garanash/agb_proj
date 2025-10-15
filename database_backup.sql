--
-- PostgreSQL database dump
--

\restrict dA4XyeHTc4186TWHPBdTwfM8mAdPYq3ZWGfRBaKeifBwUxYeItXZzSFOXF8VDKd

-- Dumped from database version 15.14
-- Dumped by pg_dump version 15.14

-- Started on 2025-10-15 12:28:26 UTC

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
-- TOC entry 3402 (class 1262 OID 16384)
-- Name: agb_prod; Type: DATABASE; Schema: -; Owner: agb_user
--

CREATE DATABASE agb_prod WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE agb_prod OWNER TO agb_user;

\unrestrict dA4XyeHTc4186TWHPBdTwfM8mAdPYq3ZWGfRBaKeifBwUxYeItXZzSFOXF8VDKd
\connect agb_prod
\restrict dA4XyeHTc4186TWHPBdTwfM8mAdPYq3ZWGfRBaKeifBwUxYeItXZzSFOXF8VDKd

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

-- Completed on 2025-10-15 12:28:26 UTC

--
-- PostgreSQL database dump complete
--

\unrestrict dA4XyeHTc4186TWHPBdTwfM8mAdPYq3ZWGfRBaKeifBwUxYeItXZzSFOXF8VDKd

