--
-- PostgreSQL database dump
--

\restrict sZ0cMbdwLKTJfxfEq4zeD0aRKtft9Wbh8yp7pxtkPCebQJUtbJ1ZezZz4MLuACr

-- Dumped from database version 16.14 (Ubuntu 16.14-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.14 (Ubuntu 16.14-0ubuntu0.24.04.1)

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

--
-- Name: ProgressLevel; Type: TYPE; Schema: public; Owner: fekm
--

CREATE TYPE public."ProgressLevel" AS ENUM (
    'NON_ACQUIS',
    'EN_COURS_DAPPRENTISSAGE',
    'ACQUIS',
    'MAITRISE'
);


ALTER TYPE public."ProgressLevel" OWNER TO fekm;

--
-- Name: TechniqueCategory; Type: TYPE; Schema: public; Owner: fekm
--

CREATE TYPE public."TechniqueCategory" AS ENUM (
    'FRAPPE_DE_FACE',
    'FRAPPE_DE_COTE',
    'SAISISSEMENTS',
    'DEFENSES_SUR_ATTAQUES_PONCTUELLES',
    'STRANGULATIONS',
    'DEFENSES_SUR_ATTAQUES_CIRCULAIRES',
    'ATTAQUES_AU_SOL',
    'ATTAQUES_AVEC_ARMES_BLANCHES',
    'ATTAQUES_AVEC_BATON',
    'ATTAQUES_AVEC_ARMES_A_FEU',
    'AUTRES'
);


ALTER TYPE public."TechniqueCategory" OWNER TO fekm;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: fekm
--

CREATE TYPE public."UserRole" AS ENUM (
    'STUDENT',
    'INSTRUCTOR',
    'ADMIN'
);


ALTER TYPE public."UserRole" OWNER TO fekm;

--
-- Name: UserVideoSlot; Type: TYPE; Schema: public; Owner: fekm
--

CREATE TYPE public."UserVideoSlot" AS ENUM (
    'DEBUTANT',
    'PROGRESSION'
);


ALTER TYPE public."UserVideoSlot" OWNER TO fekm;

--
-- Name: VideoStatus; Type: TYPE; Schema: public; Owner: fekm
--

CREATE TYPE public."VideoStatus" AS ENUM (
    'PROCESSING',
    'READY',
    'ERROR'
);


ALTER TYPE public."VideoStatus" OWNER TO fekm;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Account; Type: TABLE; Schema: public; Owner: fekm
--

CREATE TABLE public."Account" (
    id text NOT NULL,
    "userId" text NOT NULL,
    type text NOT NULL,
    provider text NOT NULL,
    "providerAccountId" text NOT NULL,
    refresh_token text,
    access_token text,
    expires_at integer,
    token_type text,
    scope text,
    id_token text,
    session_state text
);


ALTER TABLE public."Account" OWNER TO fekm;

--
-- Name: Belt; Type: TABLE; Schema: public; Owner: fekm
--

CREATE TABLE public."Belt" (
    id text NOT NULL,
    name text NOT NULL,
    color text NOT NULL,
    "order" integer NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Belt" OWNER TO fekm;

--
-- Name: BeltContent; Type: TABLE; Schema: public; Owner: fekm
--

CREATE TABLE public."BeltContent" (
    id text NOT NULL,
    "beltId" text NOT NULL,
    "examRequirements" text,
    principles text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."BeltContent" OWNER TO fekm;

--
-- Name: BeltHistory; Type: TABLE; Schema: public; Owner: fekm
--

CREATE TABLE public."BeltHistory" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "beltId" text NOT NULL,
    "promotedBy" text,
    "promotionDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."BeltHistory" OWNER TO fekm;

--
-- Name: Module; Type: TABLE; Schema: public; Owner: fekm
--

CREATE TABLE public."Module" (
    id text NOT NULL,
    "beltId" text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    description text,
    "order" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Module" OWNER TO fekm;

--
-- Name: Session; Type: TABLE; Schema: public; Owner: fekm
--

CREATE TABLE public."Session" (
    id text NOT NULL,
    "sessionToken" text NOT NULL,
    "userId" text NOT NULL,
    expires timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Session" OWNER TO fekm;

--
-- Name: Technique; Type: TABLE; Schema: public; Owner: fekm
--

CREATE TABLE public."Technique" (
    id text NOT NULL,
    "moduleId" text NOT NULL,
    name text NOT NULL,
    category public."TechniqueCategory" NOT NULL,
    "subCategory" text,
    description text,
    instructions text,
    "keyPoints" text[],
    "order" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Technique" OWNER TO fekm;

--
-- Name: TechniqueVideoLink; Type: TABLE; Schema: public; Owner: fekm
--

CREATE TABLE public."TechniqueVideoLink" (
    id text NOT NULL,
    "techniqueId" text NOT NULL,
    "videoId" text NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."TechniqueVideoLink" OWNER TO fekm;

--
-- Name: User; Type: TABLE; Schema: public; Owner: fekm
--

CREATE TABLE public."User" (
    id text NOT NULL,
    name text,
    email text NOT NULL,
    "emailVerified" timestamp(3) without time zone,
    image text,
    password text,
    role public."UserRole" DEFAULT 'STUDENT'::public."UserRole" NOT NULL,
    "beltId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."User" OWNER TO fekm;

--
-- Name: UserFavorite; Type: TABLE; Schema: public; Owner: fekm
--

CREATE TABLE public."UserFavorite" (
    id text DEFAULT (gen_random_uuid())::text NOT NULL,
    "userId" text NOT NULL,
    "techniqueId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."UserFavorite" OWNER TO fekm;

--
-- Name: UserNote; Type: TABLE; Schema: public; Owner: fekm
--

CREATE TABLE public."UserNote" (
    id text DEFAULT (gen_random_uuid())::text NOT NULL,
    "userId" text NOT NULL,
    "techniqueId" text NOT NULL,
    content text NOT NULL,
    "timestamp" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."UserNote" OWNER TO fekm;

--
-- Name: UserTechniqueProgress; Type: TABLE; Schema: public; Owner: fekm
--

CREATE TABLE public."UserTechniqueProgress" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "techniqueId" text NOT NULL,
    level public."ProgressLevel" DEFAULT 'NON_ACQUIS'::public."ProgressLevel" NOT NULL,
    notes text,
    "lastUpdated" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."UserTechniqueProgress" OWNER TO fekm;

--
-- Name: UserTechniqueVideo; Type: TABLE; Schema: public; Owner: fekm
--

CREATE TABLE public."UserTechniqueVideo" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "techniqueId" text NOT NULL,
    "videoId" text NOT NULL,
    slot public."UserVideoSlot" NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."UserTechniqueVideo" OWNER TO fekm;

--
-- Name: VerificationToken; Type: TABLE; Schema: public; Owner: fekm
--

CREATE TABLE public."VerificationToken" (
    identifier text NOT NULL,
    token text NOT NULL,
    expires timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."VerificationToken" OWNER TO fekm;

--
-- Name: VideoAsset; Type: TABLE; Schema: public; Owner: fekm
--

CREATE TABLE public."VideoAsset" (
    id text NOT NULL,
    filename text NOT NULL,
    "originalName" text NOT NULL,
    "mimeType" text NOT NULL,
    size integer NOT NULL,
    path text NOT NULL,
    duration integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    description text,
    "processedAt" timestamp(3) without time zone,
    resolution text,
    status public."VideoStatus" DEFAULT 'PROCESSING'::public."VideoStatus" NOT NULL,
    tags text[],
    "thumbnailPath" text,
    title text,
    "uploadedById" text,
    "viewCount" integer DEFAULT 0 NOT NULL
);


ALTER TABLE public."VideoAsset" OWNER TO fekm;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: fekm
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO fekm;

--
-- Data for Name: Account; Type: TABLE DATA; Schema: public; Owner: fekm
--

COPY public."Account" (id, "userId", type, provider, "providerAccountId", refresh_token, access_token, expires_at, token_type, scope, id_token, session_state) FROM stdin;
\.


--
-- Data for Name: Belt; Type: TABLE DATA; Schema: public; Owner: fekm
--

COPY public."Belt" (id, name, color, "order", description, "createdAt", "updatedAt") FROM stdin;
cmmbmy4rk0000ff6djzybl0v9	JAUNE	#FFD700	1	Premier niveau du programme FEKM. Initiation aux bases du Krav Maga.	2026-03-04 06:08:13.473	2026-03-04 06:08:13.473
cmmbmy4u1002gff6d3vvx2jbw	ORANGE	#FF8C00	2	Consolidation des bases et introduction aux défenses sur saisies.	2026-03-04 06:08:13.562	2026-03-04 06:08:13.562
cmmbmy4vn004aff6da86rrhn9	VERTE	#228B22	3	Défenses sur attaques circulaires et saisies complexes.	2026-03-04 06:08:13.619	2026-03-04 06:08:13.619
cmmbmy4x3005uff6du9sh7bxd	BLEUE	#1E90FF	4	Défenses au sol avancées et armes blanches.	2026-03-04 06:08:13.672	2026-03-04 06:08:13.672
cmmbmy4yi0076ff6dzb6kxzql	MARRON	#8B4513	5	Techniques avancées, armes à feu et situations complexes.	2026-03-04 06:08:13.722	2026-03-04 06:08:13.722
cmmbmy4zo008kff6dl5dwdlzs	NOIRE_1	#000000	6	Premier grade ceinture noire (1ère Darga).	2026-03-04 06:08:13.764	2026-03-04 06:08:13.764
\.


--
-- Data for Name: BeltContent; Type: TABLE DATA; Schema: public; Owner: fekm
--

COPY public."BeltContent" (id, "beltId", "examRequirements", principles, "createdAt", "updatedAt") FROM stdin;
cmmbmy4rk0001ff6dtatxor8v	cmmbmy4rk0000ff6djzybl0v9	Présentation correcte des techniques de base, compréhension des principes.	Défense et contre-attaque simultanée. Simplicité et efficacité.	2026-03-04 06:08:13.473	2026-03-04 06:08:13.473
cmmbmy4u1002hff6d4qvc347m	cmmbmy4u1002gff6d3vvx2jbw	Techniques du programme + révisions ceinture jaune.	Gestion du stress. Riposte immédiate.	2026-03-04 06:08:13.562	2026-03-04 06:08:13.562
cmmbmy4vn004bff6d394fymon	cmmbmy4vn004aff6da86rrhn9	Techniques du programme + révisions ceintures précédentes.	Défense sur attaques circulaires. Projection et équilibre.	2026-03-04 06:08:13.619	2026-03-04 06:08:13.619
cmmbmy4x3005vff6duobm81dh	cmmbmy4x3005uff6du9sh7bxd	Programme complet + révisions.	Combat au sol. Défense contre armes blanches.	2026-03-04 06:08:13.672	2026-03-04 06:08:13.672
cmmbmy4yi0077ff6dmted5crr	cmmbmy4yi0076ff6dzb6kxzql	Maîtrise de toutes les techniques. Combat évalué.	Défense contre armes à feu. Protection de tiers.	2026-03-04 06:08:13.722	2026-03-04 06:08:13.722
cmmbmy4zo008lff6d05clc7wd	cmmbmy4zo008kff6dl5dwdlzs	Examen complet de toutes les techniques du cursus.	Maîtrise totale. Capacité d'enseignement.	2026-03-04 06:08:13.764	2026-03-04 06:08:13.764
\.


--
-- Data for Name: BeltHistory; Type: TABLE DATA; Schema: public; Owner: fekm
--

COPY public."BeltHistory" (id, "userId", "beltId", "promotedBy", "promotionDate", notes, "createdAt") FROM stdin;
cmnezpmaz000ddnpoy3e9hxet	cmmbmy561009rff6dps3lw6pa	cmmbmy4u1002gff6d3vvx2jbw	cmnend0ss00001j5gllkdd3z0	2026-03-31 19:08:32.167	Passage de JAUNE à ORANGE	2026-03-31 19:08:32.17
\.


--
-- Data for Name: Module; Type: TABLE DATA; Schema: public; Owner: fekm
--

COPY public."Module" (id, "beltId", code, name, description, "order", "createdAt", "updatedAt") FROM stdin;
cmmbmy4rq0003ff6d8xzifaca	cmmbmy4rk0000ff6djzybl0v9	UV1	Techniques en position neutre	Coups donnés sans appels	1	2026-03-04 06:08:13.478	2026-03-04 06:08:13.478
cmmbmy4sc000nff6dr8pueqtw	cmmbmy4rk0000ff6djzybl0v9	UV2	Défenses contre saisies	Étranglements de face, côté et arrière	2	2026-03-04 06:08:13.5	2026-03-04 06:08:13.5
cmmbmy4st0015ff6dfenf0rwo	cmmbmy4rk0000ff6djzybl0v9	UV3	Chutes et roulades	Roulades avant/arrière	3	2026-03-04 06:08:13.517	2026-03-04 06:08:13.517
cmmbmy4t5001jff6dr6qpr1by	cmmbmy4rk0000ff6djzybl0v9	UV4	Techniques en position de garde	Base, déplacements	4	2026-03-04 06:08:13.53	2026-03-04 06:08:13.53
cmmbmy4ti001xff6dl5i8hyr7	cmmbmy4rk0000ff6djzybl0v9	UV5	Sol	Mouvements de base	5	2026-03-04 06:08:13.543	2026-03-04 06:08:13.543
cmmbmy4ts0027ff6dyhh8oii4	cmmbmy4rk0000ff6djzybl0v9	UV6	Armes blanches	Défenses couteau	6	2026-03-04 06:08:13.553	2026-03-04 06:08:13.553
cmmbmy4u5002jff6djreiho08	cmmbmy4u1002gff6d3vvx2jbw	UV1	Techniques en position neutre	Uppercut, coups de pied avancés	1	2026-03-04 06:08:13.565	2026-03-04 06:08:13.565
cmmbmy4uj002zff6d0dar61mr	cmmbmy4u1002gff6d3vvx2jbw	UV2	Défenses contre saisies	Étranglements avancés	2	2026-03-04 06:08:13.579	2026-03-04 06:08:13.579
cmmbmy4uv003dff6dq2fjm7lm	cmmbmy4u1002gff6d3vvx2jbw	UV3	Chutes et roulades	Chutes en hauteur	3	2026-03-04 06:08:13.591	2026-03-04 06:08:13.591
cmmbmy4v1003lff6do3hl7m9q	cmmbmy4u1002gff6d3vvx2jbw	UV4	Techniques de combat	Garde, esquives	4	2026-03-04 06:08:13.598	2026-03-04 06:08:13.598
cmmbmy4v8003tff6d3p0o2f3m	cmmbmy4u1002gff6d3vvx2jbw	UV5	Sol	Garde au sol	5	2026-03-04 06:08:13.604	2026-03-04 06:08:13.604
cmmbmy4ve0041ff6du89dc1ul	cmmbmy4u1002gff6d3vvx2jbw	UV6	Armes blanches	Défenses couteau	6	2026-03-04 06:08:13.611	2026-03-04 06:08:13.611
cmmbmy4vj0047ff6dm9k45ng6	cmmbmy4u1002gff6d3vvx2jbw	UV7	Combat	Combat souple	7	2026-03-04 06:08:13.616	2026-03-04 06:08:13.616
cmmbmy4vq004dff6d1yqk3jpu	cmmbmy4vn004aff6da86rrhn9	UV1	Techniques en position neutre	Tranchants, gifles	1	2026-03-04 06:08:13.622	2026-03-04 06:08:13.622
cmmbmy4vz004nff6dem7s78x3	cmmbmy4vn004aff6da86rrhn9	UV2	Défenses contre saisies	Cheveux, étreintes	2	2026-03-04 06:08:13.631	2026-03-04 06:08:13.631
cmmbmy4w6004vff6d0k2vtdws	cmmbmy4vn004aff6da86rrhn9	UV3	Chutes et roulades	Roulades plombées	3	2026-03-04 06:08:13.639	2026-03-04 06:08:13.639
cmmbmy4wb0051ff6dw53hiwxr	cmmbmy4vn004aff6da86rrhn9	UV4	Techniques de combat	Swing, clés	4	2026-03-04 06:08:13.644	2026-03-04 06:08:13.644
cmmbmy4wl005bff6daouw4ig3	cmmbmy4vn004aff6da86rrhn9	UV5	Sol	Garde, défenses	5	2026-03-04 06:08:13.654	2026-03-04 06:08:13.654
cmmbmy4ws005jff6d2m8jo2s3	cmmbmy4vn004aff6da86rrhn9	UV6	Armes blanches	Saisies couteau	6	2026-03-04 06:08:13.66	2026-03-04 06:08:13.66
cmmbmy4wz005rff6dq1ycso2i	cmmbmy4vn004aff6da86rrhn9	UV7	Combat	Combat 2x2	7	2026-03-04 06:08:13.668	2026-03-04 06:08:13.668
cmmbmy4x9005xff6d0ulptx3p	cmmbmy4x3005uff6du9sh7bxd	UV1	Techniques en position neutre	Tranchant intérieur	1	2026-03-04 06:08:13.677	2026-03-04 06:08:13.677
cmmbmy4xe0063ff6dcyjt12n6	cmmbmy4x3005uff6du9sh7bxd	UV2	Défenses contre saisies	Saisies vêtements	2	2026-03-04 06:08:13.683	2026-03-04 06:08:13.683
cmmbmy4xn006bff6dkar7y23b	cmmbmy4x3005uff6du9sh7bxd	UV3	Chutes et roulades	Chute amortie	3	2026-03-04 06:08:13.692	2026-03-04 06:08:13.692
cmmbmy4xs006fff6dp9sfe0cn	cmmbmy4x3005uff6du9sh7bxd	UV4	Techniques de combat	Kakato, fauchages	4	2026-03-04 06:08:13.696	2026-03-04 06:08:13.696
cmmbmy4y1006pff6dsp6nsicn	cmmbmy4x3005uff6du9sh7bxd	UV5	Sol	Défenses guillotine	5	2026-03-04 06:08:13.706	2026-03-04 06:08:13.706
cmmbmy4y9006xff6d6pgz6oms	cmmbmy4x3005uff6du9sh7bxd	UV6	Armes blanches	Couteau, bâton	6	2026-03-04 06:08:13.714	2026-03-04 06:08:13.714
cmmbmy4yf0073ff6d6zaxqnr0	cmmbmy4x3005uff6du9sh7bxd	UV7	Combat	Combat corps à corps	7	2026-03-04 06:08:13.719	2026-03-04 06:08:13.719
cmmbmy4yl0079ff6dnbk6yr12	cmmbmy4yi0076ff6dzb6kxzql	UV1	Techniques en position neutre	Coups de pied sautés	1	2026-03-04 06:08:13.725	2026-03-04 06:08:13.725
cmmbmy4yq007fff6dbe2yzt06	cmmbmy4yi0076ff6dzb6kxzql	UV2	Défenses contre saisies	Nelson, clés	2	2026-03-04 06:08:13.73	2026-03-04 06:08:13.73
cmmbmy4yw007nff6d4xf8rf6z	cmmbmy4yi0076ff6dzb6kxzql	UV3	Chutes et roulades	Toutes les chutes	3	2026-03-04 06:08:13.737	2026-03-04 06:08:13.737
cmmbmy4z0007rff6dl6nrtaht	cmmbmy4yi0076ff6dzb6kxzql	UV4	Techniques de combat	Défenses inconnues	4	2026-03-04 06:08:13.74	2026-03-04 06:08:13.74
cmmbmy4z3007vff6d8xz26vrq	cmmbmy4yi0076ff6dzb6kxzql	UV5	Sol	Déséquilibre, clés	5	2026-03-04 06:08:13.743	2026-03-04 06:08:13.743
cmmbmy4z80081ff6ddpb5bjw1	cmmbmy4yi0076ff6dzb6kxzql	UV6	Armes blanches	Couteau, bâton	6	2026-03-04 06:08:13.748	2026-03-04 06:08:13.748
cmmbmy4ze0089ff6dbud71p1c	cmmbmy4yi0076ff6dzb6kxzql	UV7	Armes à feu	Neutralisation pistolet	7	2026-03-04 06:08:13.755	2026-03-04 06:08:13.755
cmmbmy4zl008hff6dr5yj4csm	cmmbmy4yi0076ff6dzb6kxzql	UV8	Combat	Combat évalué	8	2026-03-04 06:08:13.761	2026-03-04 06:08:13.761
cmmbmy4zr008nff6dcfpjjfdz	cmmbmy4zo008kff6dl5dwdlzs	UV1	Frappes sans appel	Directs, enchaînements	1	2026-03-04 06:08:13.767	2026-03-04 06:08:13.767
cmmbmy4zw008tff6dq1953w6f	cmmbmy4zo008kff6dl5dwdlzs	UV2	Shadow codifié	3 minutes imposées	2	2026-03-04 06:08:13.772	2026-03-04 06:08:13.772
cmmbmy4zz008xff6dqbenqr0u	cmmbmy4zo008kff6dl5dwdlzs	UV3	Défenses pieds-poings	Attaques inconnues	3	2026-03-04 06:08:13.776	2026-03-04 06:08:13.776
cmmbmy5040093ff6d2tllftql	cmmbmy4zo008kff6dl5dwdlzs	UV4	Saisies et sol	Étranglements, saisies	4	2026-03-04 06:08:13.781	2026-03-04 06:08:13.781
cmmbmy50b009bff6dmlqeydb6	cmmbmy4zo008kff6dl5dwdlzs	UV5	Armes blanches	Bâton, couteau	5	2026-03-04 06:08:13.787	2026-03-04 06:08:13.787
cmmbmy50i009jff6dcfr217yx	cmmbmy4zo008kff6dl5dwdlzs	UV6	Armes à feu	Menaces toutes positions	6	2026-03-04 06:08:13.794	2026-03-04 06:08:13.794
cmmbmy50l009nff6dozbl9hld	cmmbmy4zo008kff6dl5dwdlzs	UV7	Combat	Combat évalué	7	2026-03-04 06:08:13.797	2026-03-04 06:08:13.797
\.


--
-- Data for Name: Session; Type: TABLE DATA; Schema: public; Owner: fekm
--

COPY public."Session" (id, "sessionToken", "userId", expires) FROM stdin;
\.


--
-- Data for Name: Technique; Type: TABLE DATA; Schema: public; Owner: fekm
--

COPY public."Technique" (id, "moduleId", name, category, "subCategory", description, instructions, "keyPoints", "order", "createdAt", "updatedAt") FROM stdin;
cmmbmy4rt0005ff6duu04ami8	cmmbmy4rq0003ff6d8xzifaca	Coup de tête de face	FRAPPE_DE_FACE	\N	Frappe avec le front vers le visage.	Projeter le front vers l'avant.	{"Coup sec","Viser nez/menton","Ne pas baisser garde"}	1	2026-03-04 06:08:13.481	2026-03-04 06:08:13.481
cmmbmy4rw0007ff6d8os4hdfi	cmmbmy4rq0003ff6d8xzifaca	Coude circulaire de face	FRAPPE_DE_FACE	\N	Coup de coude horizontal.	Rotation des hanches.	{"Rotation hanches","Impact coude","Protection tête"}	2	2026-03-04 06:08:13.484	2026-03-04 06:08:13.484
cmmbmy4ry0009ff6d76sq859h	cmmbmy4rq0003ff6d8xzifaca	Coude remontant	FRAPPE_DE_FACE	\N	Coup de coude montant.	Monter le coude verticalement.	{"Mouvement vertical","Impact mâchoire","Courte distance"}	3	2026-03-04 06:08:13.486	2026-03-04 06:08:13.486
cmmbmy4s0000bff6dw7kgtlxd	cmmbmy4rq0003ff6d8xzifaca	Direct de poing	FRAPPE_DE_FACE	\N	Coup de poing tendu direct.	Extension rapide du bras.	{"Extension complète","Rotation poing","Récupération rapide"}	4	2026-03-04 06:08:13.488	2026-03-04 06:08:13.488
cmmbmy4s2000dff6dm6yg2h6h	cmmbmy4rq0003ff6d8xzifaca	Coup de pied direct	FRAPPE_DE_FACE	\N	Coup de pied tendu de face.	Extension de jambe rapide.	{"Extension jambe","Récupération rapide","Cible genoux"}	5	2026-03-04 06:08:13.491	2026-03-04 06:08:13.491
cmmbmy4s4000fff6d8xdcxgr1	cmmbmy4rq0003ff6d8xzifaca	Coup de pied circulaire	FRAPPE_DE_COTE	\N	Coup de pied en arc horizontal.	Rotation sur soi-même.	{Rotation,"Impact latéral","Cible côtes"}	6	2026-03-04 06:08:13.493	2026-03-04 06:08:13.493
cmmbmy4s6000hff6drym4zs7t	cmmbmy4rq0003ff6d8xzifaca	Coup de genou direct	FRAPPE_DE_FACE	\N	Coup de genou montant.	Monter le genou rapidement.	{"Montée explosive","Cible parties","Récupération rapide"}	7	2026-03-04 06:08:13.494	2026-03-04 06:08:13.494
cmmbmy4s8000jff6dcpa39bjk	cmmbmy4rq0003ff6d8xzifaca	Marteau de poing	FRAPPE_DE_FACE	\N	Coup de poing descendant.	Descendre le poing verticalement.	{"Mouvement vertical","Cible nez/nuque","Poids du corps"}	8	2026-03-04 06:08:13.496	2026-03-04 06:08:13.496
cmmbmy4sa000lff6dxvkw9ehw	cmmbmy4rq0003ff6d8xzifaca	Coup de pied arrière	FRAPPE_DE_COTE	\N	Coup de pied donné en arrière.	Pivoter sur le pied avant.	{Pivot,"Impact talon","Cible genoux"}	9	2026-03-04 06:08:13.498	2026-03-04 06:08:13.498
cmmbmy4se000pff6dj1bloo45	cmmbmy4sc000nff6dr8pueqtw	Dégagement étranglement avant	STRANGULATIONS	\N	Libération étranglement de face.	Crocheter les mains, tirer vers le bas.	{"Crochetage mains","Genou simultané","Protéger gorge"}	1	2026-03-04 06:08:13.502	2026-03-04 06:08:13.502
cmmbmy4sg000rff6dafl2hvam	cmmbmy4sc000nff6dr8pueqtw	Dégagement étranglement arrière	STRANGULATIONS	\N	Libération en reculant.	Reculer en diagonale, attaquer parties.	{"Recul diagonal","Attaque parties",Demi-tour}	2	2026-03-04 06:08:13.504	2026-03-04 06:08:13.504
cmmbmy4si000tff6drpjxx05y	cmmbmy4sc000nff6dr8pueqtw	Dégagement étranglement côté droit	STRANGULATIONS	\N	Libération étranglement côté droit.	Saisir bras, tourner menton.	{"Saisir bras","Tourner menton","Pied genou"}	3	2026-03-04 06:08:13.506	2026-03-04 06:08:13.506
cmmbmy4sj000vff6dlern32np	cmmbmy4sc000nff6dr8pueqtw	Dégagement étranglement côté gauche	STRANGULATIONS	\N	Libération étranglement côté gauche.	Saisir bras, tourner menton.	{"Saisir bras","Tourner menton","Pied genou"}	4	2026-03-04 06:08:13.508	2026-03-04 06:08:13.508
cmmbmy4sl000xff6d5pz9jgft	cmmbmy4sc000nff6dr8pueqtw	Dégagement étranglement dos au mur	STRANGULATIONS	\N	Libération dos au mur.	Se baisser, frapper parties.	{Baisser,"Frapper parties",Décaler}	5	2026-03-04 06:08:13.51	2026-03-04 06:08:13.51
cmmbmy4sn000zff6dpivial8l	cmmbmy4sc000nff6dr8pueqtw	Dégagement étreinte par devant bras libres	SAISISSEMENTS	\N	Libération étreinte par devant.	Coup de tête, genoux répétés.	{"Tête immédiat","Genoux répétés","Pousser hanches"}	6	2026-03-04 06:08:13.511	2026-03-04 06:08:13.511
cmmbmy4sp0011ff6d0gjqib9f	cmmbmy4sc000nff6dr8pueqtw	Dégagement étreinte par devant bras pris	SAISISSEMENTS	\N	Libération étreinte bras pris.	Baisser centre gravité, frapper.	{Baisser,Frapper,Retourner}	7	2026-03-04 06:08:13.513	2026-03-04 06:08:13.513
cmmbmy4sr0013ff6dkoi7p4d9	cmmbmy4sc000nff6dr8pueqtw	Dégagement saisie poignet deux mains	SAISISSEMENTS	\N	Libération saisie deux mains.	Rotation poignet, levier pouces.	{Rotation,"Levier pouces",Tirer}	8	2026-03-04 06:08:13.515	2026-03-04 06:08:13.515
cmmbmy4sv0017ff6dwp4qvnj9	cmmbmy4st0015ff6dfenf0rwo	Roulade avant droite	AUTRES	\N	Roulade épaule droite.	Courber dos, poser mains.	{"Courbe dos","Propulsion mains",Remontée}	1	2026-03-04 06:08:13.519	2026-03-04 06:08:13.519
cmmbmy4sw0019ff6dxhimu3c1	cmmbmy4st0015ff6dfenf0rwo	Roulade avant gauche	AUTRES	\N	Roulade épaule gauche.	Courber dos, poser mains.	{"Courbe dos","Propulsion mains",Remontée}	2	2026-03-04 06:08:13.521	2026-03-04 06:08:13.521
cmmbmy4sy001bff6dnmd5gfo5	cmmbmy4st0015ff6dfenf0rwo	Chute arrière	AUTRES	\N	Réception chute de dos.	Menton rentré, frapper sol.	{"Menton rentré","Frapper sol",Garde}	3	2026-03-04 06:08:13.523	2026-03-04 06:08:13.523
cmmbmy4t0001dff6dg8163u8s	cmmbmy4st0015ff6dfenf0rwo	Chute latérale droite	AUTRES	\N	Réception chute droite.	Poser bras droit, absorber.	{"Bras absorption","Protection côtes",Remontée}	4	2026-03-04 06:08:13.524	2026-03-04 06:08:13.524
cmmbmy4t2001fff6d6fiffoxf	cmmbmy4st0015ff6dfenf0rwo	Chute latérale gauche	AUTRES	\N	Réception chute gauche.	Poser bras gauche, absorber.	{"Bras absorption","Protection côtes",Remontée}	5	2026-03-04 06:08:13.526	2026-03-04 06:08:13.526
cmmbmy4t3001hff6dey837lon	cmmbmy4st0015ff6dfenf0rwo	Roulade arrière	AUTRES	\N	Roulade en arrière.	Se laisser aller, rouler.	{"Laisser aller",Rouler,Remontée}	6	2026-03-04 06:08:13.528	2026-03-04 06:08:13.528
cmmbmy4t7001lff6dr2dahrgb	cmmbmy4t5001jff6dr6qpr1by	Position de garde	AUTRES	\N	Garde de combat base.	Pieds écartés, genoux fléchis.	{"Pieds écartés","Mains hautes",Équilibre}	1	2026-03-04 06:08:13.531	2026-03-04 06:08:13.531
cmmbmy4t9001nff6dh1jlbr4t	cmmbmy4t5001jff6dr6qpr1by	Déplacements avant/arrière	AUTRES	\N	Déplacements en ligne.	Glisser pieds sans croiser.	{"Pas glissés","Maintien garde",Équilibre}	2	2026-03-04 06:08:13.533	2026-03-04 06:08:13.533
cmmbmy4tb001pff6dsi5328bi	cmmbmy4t5001jff6dr6qpr1by	Déplacements latéraux	AUTRES	\N	Déplacements côté.	Glisser côté, pieds parallèles.	{Latéral,"Pas croisement",Garde}	3	2026-03-04 06:08:13.535	2026-03-04 06:08:13.535
cmmbmy4td001rff6deou1rk3z	cmmbmy4t5001jff6dr6qpr1by	360° défense	DEFENSES_SUR_ATTAQUES_CIRCULAIRES	\N	Parade circulaire crochet.	Tourner corps, parer avant-bras.	{Rotation,Blocage,Contre-attaque}	4	2026-03-04 06:08:13.537	2026-03-04 06:08:13.537
cmmbmy4te001tff6dslpzycie	cmmbmy4t5001jff6dr6qpr1by	Défense direct simultanée	DEFENSES_SUR_ATTAQUES_PONCTUELLES	\N	Parade et contre.	Parade paume, contre simultanée.	{"Parade paume",Contre,"Ne pas reculer"}	5	2026-03-04 06:08:13.539	2026-03-04 06:08:13.539
cmmbmy4tg001vff6d7m8kj6hq	cmmbmy4t5001jff6dr6qpr1by	Défense crochet simultanée	DEFENSES_SUR_ATTAQUES_CIRCULAIRES	\N	Parade crochet et contre.	Parade avant-bras, contre.	{Parade,Contre,Rotation}	6	2026-03-04 06:08:13.541	2026-03-04 06:08:13.541
cmmbmy4tk001zff6dbbrr8e63	cmmbmy4ti001xff6dl5i8hyr7	Pontage	ATTAQUES_AU_SOL	\N	Mouvement base au sol.	Poser pieds et nuque, pousser hanches.	{"Hanches hautes",Appui,Explosivité}	1	2026-03-04 06:08:13.544	2026-03-04 06:08:13.544
cmmbmy4tp0023ff6dtoen870a	cmmbmy4ti001xff6dl5i8hyr7	Défense étranglement au sol	STRANGULATIONS	\N	Libération étranglement sol.	Crocheter mains, tourner tête.	{Crocheter,Tourner,Remontée}	3	2026-03-04 06:08:13.549	2026-03-04 06:08:13.549
cmmbmy4tr0025ff6dxc19gghb	cmmbmy4ti001xff6dl5i8hyr7	Retournement	ATTAQUES_AU_SOL	\N	Retournement au sol.	Utiliser jambes, contrôle hanches.	{Jambes,Hanches,Explosivité}	4	2026-03-04 06:08:13.551	2026-03-04 06:08:13.551
cmmbmy4tu0029ff6d0ezrvvge	cmmbmy4ts0027ff6dyhh8oii4	360° parade couteau	ATTAQUES_AVEC_ARMES_BLANCHES	\N	Défense circulaire couteau.	Mouvement circulaire avant-bras.	{Parade,"Contrôle bras",Fuite}	1	2026-03-04 06:08:13.554	2026-03-04 06:08:13.554
cmmbmy4tw002bff6dnfzxr1g9	cmmbmy4ts0027ff6dyhh8oii4	Défense couteau haut	ATTAQUES_AVEC_ARMES_BLANCHES	\N	Parade couteau haut.	Parade avant-bras, contre.	{Parade,Contre,Contrôle}	2	2026-03-04 06:08:13.556	2026-03-04 06:08:13.556
cmmbmy4ty002dff6dfyc4wu4s	cmmbmy4ts0027ff6dyhh8oii4	Défense couteau bas	ATTAQUES_AVEC_ARMES_BLANCHES	\N	Parade couteau bas.	Parade vers bas, contre.	{"Parade bas",Contre,Contrôle}	3	2026-03-04 06:08:13.558	2026-03-04 06:08:13.558
cmmbmy4tz002fff6di28zoh3h	cmmbmy4ts0027ff6dyhh8oii4	Utilisation objet arme	ATTAQUES_AVEC_ARMES_BLANCHES	\N	Objet comme arme.	Saisir fermement, frapper.	{Saisie,Frapper,Distance}	4	2026-03-04 06:08:13.56	2026-03-04 06:08:13.56
cmmbmy4u8002nff6d6m8ajuti	cmmbmy4u5002jff6djreiho08	Crochet poing	FRAPPE_DE_COTE	\N	Coup circulaire horizontal qui part du côté, visant la tempe, la mâchoire ou le foie. Rotation des hanches pour plus de puissance.	Rotation hanches et épaules.	{Rotation,Latéral,"Coude 90°"}	2	2026-03-04 06:08:13.569	2026-03-13 14:44:46.575
cmmbmy4uc002rff6dfamnt3ro	cmmbmy4u5002jff6djreiho08	Coup pied pas glissé direct	FRAPPE_DE_FACE	\N	Coup de pied direct exécuté en glissant sur le pied de la jambe d'appui pour gagner en portée et puissance.	Glissement pied arrière.	{Glissement,Équilibre,Vitesse}	4	2026-03-04 06:08:13.573	2026-03-13 14:44:46.587
cmmbmy4ue002tff6dz5r2ssmh	cmmbmy4u5002jff6djreiho08	Coup pied pas glissé circulaire	FRAPPE_DE_COTE	\N	Coup de pied circulaire exécuté avec un glissement pour augmenter la puissance de frappe.	Glissement latéral, circulaire.	{Glissement,Rotation,Latéral}	5	2026-03-04 06:08:13.574	2026-03-13 14:44:46.589
cmmbmy4ug002vff6dp9vvfcjg	cmmbmy4u5002jff6djreiho08	Genou circulaire intérieur	FRAPPE_DE_COTE	\N	Coup de genou en arc vers l'intérieur, visant les côtes, le foie ou les parties génitales.	Monter genou côté, intérieur.	{Montée,Rotation,Côtes}	6	2026-03-04 06:08:13.576	2026-03-13 14:44:46.591
cmmbmy4ul0031ff6d98o32udm	cmmbmy4uj002zff6d0dar61mr	Dégagement guillotine	STRANGULATIONS	\N	Technique de libération d'une prise d'étranglement avant (guillotine) par saisie de l'avant-bras adverse et coup de paume aux parties génitales. Possibilité de placer l'épaule pour plus d'efficacité.	Saisir avant-bras, coup paume.	{Saisie,Paume,Rotation}	1	2026-03-04 06:08:13.581	2026-03-13 14:44:46.595
cmmbmy4uo0035ff6dbo78x7kt	cmmbmy4uj002zff6d0dar61mr	Dégagement poignet gauche	SAISISSEMENTS	\N	Rotation du poignet vers l'intérieur avec levier pour libérer une saisie de poignet gauche.	Rotation extérieure, levier.	{Rotation,Levier,Explosivité}	3	2026-03-04 06:08:13.584	2026-03-13 14:44:46.6
cmmbmy4uq0037ff6d84d5m1m5	cmmbmy4uj002zff6d0dar61mr	Dégagement étreinte derrière	SAISISSEMENTS	\N	Technique de libération d'une étreinte par derrière utilisant les coudes, les talons ou les saisies de doigts.	Baisser, frapper talon.	{Baisser,Frapper,Retourner}	4	2026-03-04 06:08:13.586	2026-03-13 14:44:46.602
cmmbmy4ur0039ff6daqkxulzi	cmmbmy4uj002zff6d0dar61mr	Sprawl	SAISISSEMENTS	\N	Défense contre une tentative d'amenée au sol par saisie des deux jambes (double leg). Placer les bras au centre pour bloquer, puis se relever vers l'arrière ou sur le côté.	Jambes arrière, hanches basses.	{Jambes,Hanches,Récupération}	5	2026-03-04 06:08:13.588	2026-03-13 14:44:46.604
cmmbmy4uw003fff6df0do1fjt	cmmbmy4uv003dff6dq2fjm7lm	Chute hauteur	AUTRES	\N	Technique de chute depuis une hauteur avec amorti progressif: flexion des genoux, pose des mains, avant-bras, puis chute latérale.	Amorti progressif, roulade.	{Amorti,Tête,Contrôle}	1	2026-03-04 06:08:13.592	2026-03-13 14:44:46.619
cmmbmy4uy003hff6d239toluz	cmmbmy4uv003dff6dq2fjm7lm	Roulade Judo	AUTRES	\N	Roulade avant avec amorti du bras en diagonal, utilisée pour absorber l'énergie d'une chute ou d'une projection.	Rouler arc, poser main.	{Arc,Absorption,Fluide}	2	2026-03-04 06:08:13.594	2026-03-13 14:44:46.621
cmmbmy4v3003nff6du61jzh83	cmmbmy4v1003lff6do3hl7m9q	Double leg	SAISISSEMENTS	\N	Amenée au sol par saisie des deux jambes de l'adversaire. Penetration profonde, épaule dans l'abdomen, projection par poussée et traction.	Baisse niveau, tête hanche.	{Baisse,Tête,Conduite}	1	2026-03-04 06:08:13.599	2026-03-13 14:44:46.626
cmmbmy4v4003pff6dodfcflw4	cmmbmy4v1003lff6do3hl7m9q	Single leg	SAISISSEMENTS	\N	Saisie d'une seule jambe avec contrôle de la tête ou du corps pour projeter l'adversaire.	Baisse, saisie, poussée.	{Baisse,Saisie,Poussée}	2	2026-03-04 06:08:13.601	2026-03-13 14:44:46.628
cmmbmy4v6003rff6dm7ogip5s	cmmbmy4v1003lff6do3hl7m9q	Esquive corps	DEFENSES_SUR_ATTAQUES_PONCTUELLES	\N	Déplacement du buste vers l'arrière ou sur le côté pour éviter un coup direct.	Décalage buste, retour.	{Décalage,Retour,Contre}	3	2026-03-04 06:08:13.602	2026-03-13 14:44:46.63
cmmbmy4vb003xff6decd6gqly	cmmbmy4v8003tff6d3p0o2f3m	Pontage latéral	ATTAQUES_AU_SOL	\N	Technique de retournement au sol en utilisant le pont (langouste) pour renverser l'adversaire.	Rotation côté, poussée hanches.	{Rotation,Poussée,Espace}	2	2026-03-04 06:08:13.607	2026-03-13 14:44:46.65
cmmbmy4tn0021ff6dfhtfjbyr	cmmbmy4ti001xff6dl5i8hyr7	Remontée technique	ATTAQUES_AU_SOL	\N	Technique de remontée depuis le sol vers la position debout en protégeant et en contrôlant l'adversaire.	Rouler côté, genou au sol.	{Rouler,Genou,Remontée}	2	2026-03-04 06:08:13.547	2026-03-13 14:44:46.652
cmmbmy4vg0043ff6dqxqtbcyu	cmmbmy4ve0041ff6du89dc1ul	Défense couteau haut 360	ATTAQUES_AVEC_ARMES_BLANCHES	\N	Parade circulaire de l'avant-bras (360°) contre une attaque de couteau de haut en bas, suivie de contre-attaques.	Parade avant-bras, 2 coups.	{Parade,"2 coups",Attraper}	1	2026-03-04 06:08:13.612	2026-03-13 14:44:46.663
cmmbmy4vi0045ff6dvnpj6rsl	cmmbmy4ve0041ff6du89dc1ul	Défense couteau bas 360	ATTAQUES_AVEC_ARMES_BLANCHES	\N	Parade circulaire de l'avant-bras contre une attaque de couteau de bas en haut, avec contrôle du bras armé.	Parade bas, contre.	{"Parade bas",Contre,Contrôle}	2	2026-03-04 06:08:13.614	2026-03-13 14:44:46.665
cmmbmy4vr004fff6dmg280byt	cmmbmy4vq004dff6d1yqk3jpu	Tranchant extérieur	FRAPPE_DE_COTE	\N	Coup tranchant latéral.	Rotation corps, impact tranchant.	{Rotation,Tranchant,Hanche}	1	2026-03-04 06:08:13.624	2026-03-04 06:08:13.624
cmmbmy4vt004hff6dy5p2lv8j	cmmbmy4vq004dff6d1yqk3jpu	Gifle intérieur	FRAPPE_DE_COTE	\N	Pied circulaire intérieur.	Jambe tendue, impact intérieur.	{Tendue,Intérieur,Hanche}	2	2026-03-04 06:08:13.626	2026-03-04 06:08:13.626
cmmbmy4vv004jff6dctxwsmnl	cmmbmy4vq004dff6d1yqk3jpu	Gifle extérieur	FRAPPE_DE_COTE	\N	Pied circulaire extérieur.	Jambe tendue, impact extérieur.	{Tendue,Extérieur,Rotation}	3	2026-03-04 06:08:13.628	2026-03-04 06:08:13.628
cmmbmy4vx004lff6do7qkha6g	cmmbmy4vq004dff6d1yqk3jpu	Genou sauté	FRAPPE_DE_FACE	\N	Genou avec saut.	Petit saut, montée explosive.	{Saut,Explosif,Puissant}	4	2026-03-04 06:08:13.63	2026-03-04 06:08:13.63
cmmbmy4w1004pff6d1q92kf35	cmmbmy4vz004nff6dem7s78x3	Dégagement cheveux	SAISISSEMENTS	\N	Libération cheveux.	Protection tête, frappe, torsion.	{Protection,Frappe,Torsion}	1	2026-03-04 06:08:13.633	2026-03-04 06:08:13.633
cmmbmy4w3004rff6dkkijulxt	cmmbmy4vz004nff6dem7s78x3	Dégagement étreinte devant	SAISISSEMENTS	\N	Libération étreinte.	Baisser, frapper, retourner.	{Baisser,Frapper,Retourner}	2	2026-03-04 06:08:13.635	2026-03-04 06:08:13.635
cmmbmy4w4004tff6dnv3n7pnx	cmmbmy4vz004nff6dem7s78x3	Dégagement saisie jambe	SAISISSEMENTS	\N	Libération jambe.	Équilibre, frappe, dégagement.	{Équilibre,Frappe,Dégagement}	3	2026-03-04 06:08:13.637	2026-03-04 06:08:13.637
cmmbmy4w9004zff6dznf9v8le	cmmbmy4w6004vff6d0k2vtdws	Roulade latérale	AUTRES	\N	Roulade côté.	Roulade latérale, absorption.	{Latérale,Absorption,Remontée}	2	2026-03-04 06:08:13.642	2026-03-04 06:08:13.642
cmmbmy4wd0053ff6d6fc7bnbc	cmmbmy4wb0051ff6dw53hiwxr	Swing	FRAPPE_DE_COTE	\N	Poing large circulaire.	Grand arc, rotation épaule.	{Arc,Rotation,Latéral}	1	2026-03-04 06:08:13.645	2026-03-04 06:08:13.645
cmmbmy4wg0055ff6dh1po1r3a	cmmbmy4wb0051ff6dw53hiwxr	Clé poignet	SAISISSEMENTS	\N	Contrôle poignet.	Saisie ferme, levier.	{Saisie,Levier,Contrôle}	2	2026-03-04 06:08:13.648	2026-03-04 06:08:13.648
cmmbmy4wi0057ff6dxbhxpbft	cmmbmy4wb0051ff6dw53hiwxr	Clé coude	SAISISSEMENTS	\N	Contrôle coude.	Saisie coude, levier.	{Saisie,Levier,Contrôle}	3	2026-03-04 06:08:13.65	2026-03-04 06:08:13.65
cmmbmy4wj0059ff6dymez13rk	cmmbmy4wb0051ff6dw53hiwxr	Enchaînement	FRAPPE_DE_FACE	\N	Enchaînement frappes.	Combinaison poing pied.	{Fluidité,Puissance,Récupération}	4	2026-03-04 06:08:13.652	2026-03-04 06:08:13.652
cmmbmy4wn005dff6dkky5z9s0	cmmbmy4wl005bff6daouw4ig3	Position croix	ATTAQUES_AU_SOL	\N	Contrôle 90 degrés.	Genou ventre, contrôle épaules.	{Genou,Contrôle,90°}	1	2026-03-04 06:08:13.655	2026-03-04 06:08:13.655
cmmbmy4wp005fff6dp8v9k5f9	cmmbmy4wl005bff6daouw4ig3	Défense étranglement sol	STRANGULATIONS	\N	Libération étranglement.	Crocheter, tourner, remonter.	{Crocheter,Tourner,Remonter}	2	2026-03-04 06:08:13.657	2026-03-04 06:08:13.657
cmmbmy4wq005hff6duv0ztcbk	cmmbmy4wl005bff6daouw4ig3	Montée technique	ATTAQUES_AU_SOL	\N	Montée au sol.	Technique montée, contrôle.	{Technique,Montée,Contrôle}	3	2026-03-04 06:08:13.659	2026-03-04 06:08:13.659
cmmbmy4wu005lff6ddpghhp35	cmmbmy4ws005jff6d2m8jo2s3	Défense couteau haut	ATTAQUES_AVEC_ARMES_BLANCHES	\N	Parade couteau haut.	Parade, contre, contrôle.	{Parade,Contre,Contrôle}	1	2026-03-04 06:08:13.662	2026-03-04 06:08:13.662
cmmbmy4wv005nff6dcnif1fes	cmmbmy4ws005jff6d2m8jo2s3	Défense couteau bas	ATTAQUES_AVEC_ARMES_BLANCHES	\N	Parade couteau bas.	Parade bas, contre.	{Parade,Contre,Contrôle}	2	2026-03-04 06:08:13.664	2026-03-04 06:08:13.664
cmmbmy4wx005pff6dux61qtv6	cmmbmy4ws005jff6d2m8jo2s3	Défense couteau piqué	ATTAQUES_AVEC_ARMES_BLANCHES	\N	Parade couteau piqué.	Déviation, contre, contrôle.	{Déviation,Contre,Contrôle}	3	2026-03-04 06:08:13.666	2026-03-04 06:08:13.666
cmmbmy4x1005tff6dlckt051k	cmmbmy4wz005rff6dq1ycso2i	Combat 2x2	AUTRES	\N	Combat évalué.	Combat 2x2 minutes.	{Courage,Technique,Endurance}	1	2026-03-04 06:08:13.67	2026-03-04 06:08:13.67
cmmbmy4xb005zff6dg41cqsvr	cmmbmy4x9005xff6d0ulptx3p	Tranchant intérieur	FRAPPE_DE_COTE	\N	Tranchant intérieur.	Rotation, impact intérieur.	{Rotation,Intérieur,Hanche}	1	2026-03-04 06:08:13.679	2026-03-04 06:08:13.679
cmmbmy4xc0061ff6d4va1vnkb	cmmbmy4x9005xff6d0ulptx3p	Défense coup côté	DEFENSES_SUR_ATTAQUES_CIRCULAIRES	\N	Défense crochet.	Parade, contre simultanée.	{Parade,Contre,Simultanée}	2	2026-03-04 06:08:13.681	2026-03-04 06:08:13.681
cmmbmy4xh0065ff6dfchlt9oz	cmmbmy4xe0063ff6dcyjt12n6	Dégagement saisie vêtements	SAISISSEMENTS	\N	Libération vêtements.	Saisie main, rotation, levier.	{Saisie,Rotation,Levier}	1	2026-03-04 06:08:13.686	2026-03-04 06:08:13.686
cmmbmy4xk0067ff6dtdphckiy	cmmbmy4xe0063ff6dcyjt12n6	Dégagement épaule	SAISISSEMENTS	\N	Libération épaule.	Baisser, rotation, frapper.	{Baisser,Rotation,Frapper}	2	2026-03-04 06:08:13.688	2026-03-04 06:08:13.688
cmmbmy4xl0069ff6da59m9cim	cmmbmy4xe0063ff6dcyjt12n6	Dégagement dos	SAISISSEMENTS	\N	Libération saisie dos.	Saisie bras, rotation, frapper.	{Saisie,Rotation,Frapper}	3	2026-03-04 06:08:13.69	2026-03-04 06:08:13.69
cmmbmy4xq006dff6dr96zlnr7	cmmbmy4xn006bff6dkar7y23b	Chute amortie avant-bras	AUTRES	\N	Chute avant-bras.	Absorption avant-bras, roulade.	{Absorption,Avant-bras,Roulade}	1	2026-03-04 06:08:13.694	2026-03-04 06:08:13.694
cmmbmy4xu006hff6dkjwd7e30	cmmbmy4xs006fff6dp9sfe0cn	Kakato	FRAPPE_DE_COTE	\N	Coup talon arrière.	Rotation, talon arrière.	{Rotation,Talon,Arrière}	1	2026-03-04 06:08:13.698	2026-03-04 06:08:13.698
cmmbmy4xw006jff6du2yvdm6w	cmmbmy4xs006fff6dp9sfe0cn	Fauchage intérieur	ATTAQUES_AU_SOL	\N	Fauchage intérieur.	Bas niveau, fauchage jambe.	{Bas,Fauchage,Intérieur}	2	2026-03-04 06:08:13.7	2026-03-04 06:08:13.7
cmmbmy4xy006lff6dyf3vwi0u	cmmbmy4xs006fff6dp9sfe0cn	Fauchage extérieur	ATTAQUES_AU_SOL	\N	Fauchage extérieur.	Bas niveau, fauchage jambe.	{Bas,Fauchage,Extérieur}	3	2026-03-04 06:08:13.702	2026-03-04 06:08:13.702
cmmbmy4y0006nff6d6gswnivs	cmmbmy4xs006fff6dp9sfe0cn	Projection épaule	ATTAQUES_AU_SOL	\N	Projection épaule.	Saisie, rotation, projection.	{Saisie,Rotation,Projection}	4	2026-03-04 06:08:13.704	2026-03-04 06:08:13.704
cmmbmy4y4006rff6d8s2s72eg	cmmbmy4y1006pff6dsp6nsicn	Défense guillotine	STRANGULATIONS	\N	Libération guillotine.	Crocheter, tourner, remonter.	{Crocheter,Tourner,Remonter}	1	2026-03-04 06:08:13.708	2026-03-04 06:08:13.708
cmmbmy4vl0049ff6djv8llcn6	cmmbmy4vj0047ff6dm9k45ng6	Combat 2x2 minutes	AUTRES	\N	Combat de démonstration de 2 reprises de 2 minutes avec 30 secondes de repos. Évaluation de l'attitude générale: courage, détermination, lucidité, sang-froid, technique et respect.	Combat garde avec contrôles.	{Courage,Détermination,Respect}	1	2026-03-04 06:08:13.617	2026-03-13 14:44:46.674
cmmbmy4y6006tff6d58i341oq	cmmbmy4y1006pff6dsp6nsicn	Défense étranglement sol	STRANGULATIONS	\N	Libération étranglement.	Protection, crochetage, remontée.	{Protection,Crochetage,Remontée}	2	2026-03-04 06:08:13.71	2026-03-04 06:08:13.71
cmmbmy4yb006zff6d97vaj0l4	cmmbmy4y9006xff6d6pgz6oms	Défense couteau rasoir	ATTAQUES_AVEC_ARMES_BLANCHES	\N	Défense rasoir.	Parade, contre, contrôle.	{Parade,Contre,Contrôle}	1	2026-03-04 06:08:13.715	2026-03-04 06:08:13.715
cmmbmy4yd0071ff6df5ngpefk	cmmbmy4y9006xff6d6pgz6oms	Défense bâton	ATTAQUES_AVEC_BATON	\N	Défense bâton.	Entrer, contre, contrôle.	{Entrer,Contre,Contrôle}	2	2026-03-04 06:08:13.717	2026-03-04 06:08:13.717
cmmbmy4yg0075ff6djrxcj6as	cmmbmy4yf0073ff6d6zaxqnr0	Combat corps à corps	AUTRES	\N	Combat rapproché.	Clinch, genoux, coudes.	{Clinch,Genoux,Coudes}	1	2026-03-04 06:08:13.721	2026-03-04 06:08:13.721
cmmbmy4yn007bff6dgw0j4g6l	cmmbmy4yl0079ff6dnbk6yr12	Coup pied sauté	FRAPPE_DE_FACE	\N	Pied avec saut.	Saut, extension, impact.	{Saut,Extension,Impact}	1	2026-03-04 06:08:13.727	2026-03-04 06:08:13.727
cmmbmy4yo007dff6djcf1nbxy	cmmbmy4yl0079ff6dnbk6yr12	Enchaînement avancé	FRAPPE_DE_FACE	\N	Enchaînement complexe.	Combinaison multiple, fluidité.	{Multiple,Fluidité,Puissance}	2	2026-03-04 06:08:13.729	2026-03-04 06:08:13.729
cmmbmy4ys007hff6dtqlmsob2	cmmbmy4yq007fff6dbe2yzt06	Dégagement Nelson	STRANGULATIONS	\N	Libération Nelson.	Protection, crochetage, fuite.	{Protection,Crochetage,Fuite}	1	2026-03-04 06:08:13.732	2026-03-04 06:08:13.732
cmmbmy4yt007jff6df47s0l6x	cmmbmy4yq007fff6dbe2yzt06	Clé coude avancée	SAISISSEMENTS	\N	Clé coude complexe.	Saisie, levier, projection.	{Saisie,Levier,Projection}	2	2026-03-04 06:08:13.734	2026-03-04 06:08:13.734
cmmbmy4yv007lff6d7pd8fsri	cmmbmy4yq007fff6dbe2yzt06	Dégagement saisie complexe	SAISISSEMENTS	\N	Libération complexe.	Analyse, technique, exécution.	{Analyse,Technique,Exécution}	3	2026-03-04 06:08:13.735	2026-03-04 06:08:13.735
cmmbmy4yy007pff6dx94hx4n6	cmmbmy4yw007nff6d4xf8rf6z	Toutes chutes	AUTRES	\N	Toutes les chutes.	Exécution parfaite, contrôle.	{Parfaite,Contrôle,Fluidité}	1	2026-03-04 06:08:13.738	2026-03-04 06:08:13.738
cmmbmy4z1007tff6dpuxwj8hg	cmmbmy4z0007rff6dl6nrtaht	Défense inconnue	DEFENSES_SUR_ATTAQUES_PONCTUELLES	\N	Réaction inconnue.	Réactivité, adaptation, contre.	{Réactivité,Adaptation,Contre}	1	2026-03-04 06:08:13.742	2026-03-04 06:08:13.742
cmmbmy4z5007xff6djnbnrlk8	cmmbmy4z3007vff6d8xz26vrq	Déséquilibre	ATTAQUES_AU_SOL	\N	Déséquilibre au sol.	Levier, déséquilibre, contrôle.	{Levier,Déséquilibre,Contrôle}	1	2026-03-04 06:08:13.745	2026-03-04 06:08:13.745
cmmbmy4z6007zff6d9qjwwet9	cmmbmy4z3007vff6d8xz26vrq	Clé avancée	ATTAQUES_AU_SOL	\N	Clé complexe.	Position, levier, soumission.	{Position,Levier,Soumission}	2	2026-03-04 06:08:13.747	2026-03-04 06:08:13.747
cmmbmy4z90083ff6dn752nc91	cmmbmy4z80081ff6ddpb5bjw1	Défense couteau avancée	ATTAQUES_AVEC_ARMES_BLANCHES	\N	Défense couteau pro.	Parade, contre, désarmement.	{Parade,Contre,Désarmement}	1	2026-03-04 06:08:13.75	2026-03-04 06:08:13.75
cmmbmy4zb0085ff6d7qrfneeq	cmmbmy4z80081ff6ddpb5bjw1	Défense bâton avancée	ATTAQUES_AVEC_BATON	\N	Défense bâton pro.	Entrer, contre, désarmement.	{Entrer,Contre,Désarmement}	2	2026-03-04 06:08:13.751	2026-03-04 06:08:13.751
cmmbmy4zd0087ff6dwsv7450i	cmmbmy4z80081ff6ddpb5bjw1	Défense baïonnette	ATTAQUES_AVEC_ARMES_BLANCHES	\N	Défense baïonnette.	Déviation, contre, contrôle.	{Déviation,Contre,Contrôle}	3	2026-03-04 06:08:13.753	2026-03-04 06:08:13.753
cmmbmy4zg008bff6dnfvcewpg	cmmbmy4ze0089ff6dbud71p1c	Désarmement pistolet face	ATTAQUES_AVEC_ARMES_A_FEU	\N	Désarmement face.	Déviation, saisie, désarmement.	{Déviation,Saisie,Désarmement}	1	2026-03-04 06:08:13.756	2026-03-04 06:08:13.756
cmmbmy4zh008dff6dpaxrc70b	cmmbmy4ze0089ff6dbud71p1c	Désarmement pistolet dos	ATTAQUES_AVEC_ARMES_A_FEU	\N	Désarmement dos.	Rotation, saisie, désarmement.	{Rotation,Saisie,Désarmement}	2	2026-03-04 06:08:13.758	2026-03-04 06:08:13.758
cmmbmy4zj008fff6d9otxmibu	cmmbmy4ze0089ff6dbud71p1c	Désarmement pistolet côté	ATTAQUES_AVEC_ARMES_A_FEU	\N	Désarmement côté.	Déviation, saisie, désarmement.	{Déviation,Saisie,Désarmement}	3	2026-03-04 06:08:13.759	2026-03-04 06:08:13.759
cmmbmy4zm008jff6dbribohua	cmmbmy4zl008hff6dr5yj4csm	Combat évalué	AUTRES	\N	Combat 2x2 évalué.	Technique, stratégie, endurance.	{Technique,Stratégie,Endurance}	1	2026-03-04 06:08:13.763	2026-03-04 06:08:13.763
cmmbmy4zt008pff6d2adyzbyq	cmmbmy4zr008nff6dcfpjjfdz	Direct avancé	FRAPPE_DE_FACE	\N	Direct parfait.	Technique, puissance, récupération.	{Technique,Puissance,Récupération}	1	2026-03-04 06:08:13.769	2026-03-04 06:08:13.769
cmmbmy4zu008rff6d71bpkn35	cmmbmy4zr008nff6dcfpjjfdz	Enchaînement expert	FRAPPE_DE_FACE	\N	Enchaînement pro.	Fluidité, puissance, créativité.	{Fluidité,Puissance,Créativité}	2	2026-03-04 06:08:13.771	2026-03-04 06:08:13.771
cmmbmy4zy008vff6dkk8ws0p6	cmmbmy4zw008tff6dq1953w6f	Shadow codifié	AUTRES	\N	3 minutes imposées.	Séquence, fluidité, respect.	{Séquence,Fluidité,Respect}	1	2026-03-04 06:08:13.774	2026-03-04 06:08:13.774
cmmbmy501008zff6d10weihf3	cmmbmy4zz008xff6dqbenqr0u	Défense connue	DEFENSES_SUR_ATTAQUES_PONCTUELLES	\N	Défense technique.	Parade, contre, contrôle.	{Parade,Contre,Contrôle}	1	2026-03-04 06:08:13.777	2026-03-04 06:08:13.777
cmmbmy5030091ff6dnww51po5	cmmbmy4zz008xff6dqbenqr0u	Défense inconnue	DEFENSES_SUR_ATTAQUES_PONCTUELLES	\N	Réaction adaptée.	Réactivité, adaptation, efficacité.	{Réactivité,Adaptation,Efficacité}	2	2026-03-04 06:08:13.779	2026-03-04 06:08:13.779
cmmbmy5060095ff6dbzaiue3i	cmmbmy5040093ff6d2tllftql	Étranglement avancé	STRANGULATIONS	\N	Libération pro.	Technique, explosivité, contrôle.	{Technique,Explosivité,Contrôle}	1	2026-03-04 06:08:13.782	2026-03-04 06:08:13.782
cmmbmy5080097ff6deczl1v0c	cmmbmy5040093ff6d2tllftql	Saisie complexe	SAISISSEMENTS	\N	Libération complexe.	Analyse, technique, exécution.	{Analyse,Technique,Exécution}	2	2026-03-04 06:08:13.784	2026-03-04 06:08:13.784
cmmbmy5090099ff6db5bv3o2v	cmmbmy5040093ff6d2tllftql	Technique sol avancée	ATTAQUES_AU_SOL	\N	Technique sol pro.	Position, transition, contrôle.	{Position,Transition,Contrôle}	3	2026-03-04 06:08:13.786	2026-03-04 06:08:13.786
cmmbmy50d009dff6dchymp6d7	cmmbmy50b009bff6dmlqeydb6	Défense bâton expert	ATTAQUES_AVEC_BATON	\N	Défense bâton pro.	Entrer, contre, désarmement.	{Entrer,Contre,Désarmement}	1	2026-03-04 06:08:13.789	2026-03-04 06:08:13.789
cmmbmy50e009fff6dvbtgneee	cmmbmy50b009bff6dmlqeydb6	Défense couteau expert	ATTAQUES_AVEC_ARMES_BLANCHES	\N	Défense couteau pro.	Parade, contre, désarmement.	{Parade,Contre,Désarmement}	2	2026-03-04 06:08:13.791	2026-03-04 06:08:13.791
cmmbmy50g009hff6diw1eeg8c	cmmbmy50b009bff6dmlqeydb6	Défense 2 adversaires	AUTRES	\N	Gestion multiple.	Positionnement, priorité, fuite.	{Positionnement,Priorité,Fuite}	3	2026-03-04 06:08:13.792	2026-03-04 06:08:13.792
cmmbmy50j009lff6dw6u9oe51	cmmbmy50i009jff6dcfr217yx	Désarmement pistolet toutes positions	ATTAQUES_AVEC_ARMES_A_FEU	\N	Désarmement complet.	Toutes positions, efficacité.	{"Toutes positions",Efficacité,Contrôle}	1	2026-03-04 06:08:13.796	2026-03-04 06:08:13.796
cmmbmy50n009pff6d5zs6xfci	cmmbmy50l009nff6dozbl9hld	Combat expert	AUTRES	\N	Combat 2x2 expert.	Maîtrise, stratégie, victoire.	{Maîtrise,Stratégie,Victoire}	1	2026-03-04 06:08:13.799	2026-03-04 06:08:13.799
cmmp0ado900035a2v08jpvys7	cmmbmy4uj002zff6d0dar61mr	Dégagement étranglement arrière poussé	DEFENSES_SUR_ATTAQUES_PONCTUELLES	\N	Avancée d'un pas pour déséquilibrer l'agresseur, levage d'un bras pour casser l'étranglement arrière.	1. Avancer d'un pas pour déséquilibrer l'agresseur\n2. Lever un bras pour casser l'étranglement\n3. Contrôler et contre-attaquer	{"Avancée décisive","Lever le bras",Déséquilibre}	8	2026-03-13 14:42:40.186	2026-03-13 14:44:46.614
cmmp0adoc00055a2vulbn2w5o	cmmbmy4uj002zff6d0dar61mr	Dégagement étranglement arrière avec avant-bras	DEFENSES_SUR_ATTAQUES_PONCTUELLES	\N	Saisie du poignet adverse, coup aux parties, demi-tour sous le bras, coup de genou et contrôle au sol en clé.	1. Saisir le poignet de l'agresseur\n2. Coup de paume aux parties génitales\n3. Demi-tour sous le bras de l'agresseur\n4. Coup de genou\n5. Contrôle de l'agresseur en clé au sol	{"Saisie ferme du poignet","Coup aux parties","Demi-tour rapide","Contrôle au sol"}	9	2026-03-13 14:42:40.188	2026-03-13 14:44:46.616
cmmp0adoe00075a2v3uj2vg2z	cmmbmy4uj002zff6d0dar61mr	Projection étranglement poids avant	DEFENSES_SUR_ATTAQUES_PONCTUELLES	\N	Utilisation du poids de l'agresseur qui penche en avant pour projeter par-dessus l'épaule ou sur le côté.	1. Profiter du poids de l'agresseur\n2. Pivoter les hanches\n3. Projeter l'agresseur par-dessus\n4. Contrôler la chute	{"Utiliser le poids adverse","Pivot des hanches","Projection fluide"}	10	2026-03-13 14:42:40.19	2026-03-13 14:44:46.617
cmmp0adog00095a2vkrvvypad	cmmbmy4uv003dff6dq2fjm7lm	Chute arrière demi-tour volte-face	AUTRES	\N	Chute arrière suivie d'un demi-tour volte-face pour se retrouver face à l'adversaire ou se relever en position défensive.	1. Chuter en arrière\n2. Effectuer un demi-tour volte-face\n3. Amortir avec les bras\n4. Se repositionner rapidement	{"Demi-tour rapide","Amorti des bras",Repositionnement}	4	2026-03-13 14:42:40.192	2026-03-13 14:44:46.624
cmmp0adoi000b5a2vngd0vbmj	cmmbmy4v1003lff6do3hl7m9q	Coup direct poing retourné	FRAPPE_DE_FACE	\N	Coup de poing direct avec rotation du poignet à l'impact pour augmenter la pénétration.	1. Position de garde\n2. Rotation du poignet\n3. Extension du bras\n4. Impact avec les deux premiers phalanges	{"Rotation poignet","Extension bras","Impact précis"}	4	2026-03-13 14:42:40.194	2026-03-13 14:44:46.631
cmmp0adok000d5a2vd4izeg9k	cmmbmy4v1003lff6do3hl7m9q	Coup poing retourné marteau	FRAPPE_DE_FACE	\N	Coup descendant avec le dos du poing, l'avant-bras ou le coude selon la distance.	1. Adapter la technique selon la distance\n2. Court: coude\n3. Moyen: avant-bras\n4. Long: marteau poing fermé	{"Adapter la distance","Coup descendant","Impact puissant"}	5	2026-03-13 14:42:40.196	2026-03-13 14:44:46.633
cmmp0adom000f5a2v4g6vuahj	cmmbmy4v1003lff6do3hl7m9q	Coup pied défense en avant	FRAPPE_DE_FACE	\N	Coup de pied direct de défense pour créer de la distance, visant généralement le plexus ou les genoux.	1. Lever le genou\n2. Extension de la jambe\n3. Impact avec le talon ou le pied\n4. Retour rapide	{"Genou haut","Extension rapide","Retour garde"}	6	2026-03-13 14:42:40.199	2026-03-13 14:44:46.635
cmmp0adop000h5a2vosloriui	cmmbmy4v1003lff6do3hl7m9q	Coup pied arrière uppercut	FRAPPE_DE_COTE	\N	Coup de pied montant arrière, puissant, visant le menton ou le plexus.	1. Rotation des hanches\n2. Lever la jambe en arc\n3. Impact sous la cible\n4. Retour position	{"Rotation hanches","Trajectoire arc","Impact sous cible"}	7	2026-03-13 14:42:40.201	2026-03-13 14:44:46.636
cmmp0ados000l5a2v721qcgkr	cmmbmy4v1003lff6do3hl7m9q	Défense avant-bras avant contre direct	DEFENSES_SUR_ATTAQUES_PONCTUELLES	\N	Blocage du coup de poing adverse avec l'avant-bras, suivi d'une saisie ou d'une riposte.	1. Contre direct droit: défense avant-bras gauche, contre-attaque direct droit\n2. Possibilité d'attraper et baisser le bras adverse\n3. Contre direct gauche: défense avant-bras gauche, riposte gauche poing retourné	{"Blocage avant-bras","Contrôle bras adverse","Riposte immédiate"}	9	2026-03-13 14:42:40.205	2026-03-13 14:44:46.64
cmmp0adou000n5a2vk11kzqx7	cmmbmy4v1003lff6do3hl7m9q	Défense extérieure paume tournée contre coup de pied	DEFENSES_SUR_ATTAQUES_CIRCULAIRES	\N	Déviation extérieure du coup de pied avec la paume vers l'extérieur, en se déplaçant latéralement.	1. Déplacement latéral\n2. Défense extérieure paume tournée\n3. Contre-attaque immédiate	{Déplacement,"Déviation extérieure",Contre-attaque}	10	2026-03-13 14:42:40.207	2026-03-13 14:44:46.642
cmmp0adow000p5a2v1kncd4bl	cmmbmy4v1003lff6do3hl7m9q	Défense extérieure piquée contre coup de pied	DEFENSES_SUR_ATTAQUES_CIRCULAIRES	\N	Déviation du coup de pied avec le bras arrière en mouvement piqué vers le bas.	1. Bras arrière en piqué\n2. Déviation du coup de pied\n3. Contre-attaque rapide	{"Bras arrière","Mouvement piqué","Contre rapide"}	11	2026-03-13 14:42:40.208	2026-03-13 14:44:46.643
cmmp0adoy000r5a2vwhw4i6hu	cmmbmy4v1003lff6do3hl7m9q	Esquive buste arrière contre coup de poing	DEFENSES_SUR_ATTAQUES_PONCTUELLES	\N	Retrait du buste vers l'arrière pour faire passer le coup adverse, suivi d'un coup de pied direct.	1. Esquive du buste vers l'arrière\n2. Éviter le coup de poing\n3. Contre-attaque coup de pied direct	{"Esquive buste",Timing,"Contre pied direct"}	12	2026-03-13 14:42:40.21	2026-03-13 14:44:46.645
cmmp0adp0000t5a2vtsyekb4r	cmmbmy4v1003lff6do3hl7m9q	Esquive buste contre gauche droit simultané	DEFENSES_SUR_ATTAQUES_PONCTUELLES	\N	Esquive du buste suivie d'une contre-attaque simultanée des deux poings (gauche-droite).	1. Esquive du buste\n2. Contre simultanée des deux bras\n3. Enchaînement puissant	{Esquive,"Contre simultanée",Puissance}	13	2026-03-13 14:42:40.212	2026-03-13 14:44:46.647
cmmp0adp1000v5a2vauatdwvi	cmmbmy4v8003tff6d3p0o2f3m	Replacement pied sur hanches	ATTAQUES_AU_SOL	\N	Quand l'agresseur debout tente de passer sur le côté, placement du pied sur ses hanches pour contrôler la distance.	1. Défenseur au sol\n2. Agresseur debout tente de passer\n3. Placement du pied sur les hanches de l'agresseur\n4. Création d'espace et contrôle	{"Placement pied","Contrôle hanches","Création espace"}	4	2026-03-13 14:42:40.214	2026-03-13 14:44:46.654
cmmp0adp3000x5a2vlykmie6o	cmmbmy4v8003tff6d3p0o2f3m	Pied hanche pied tête	ATTAQUES_AU_SOL	\N	Position de garde au sol avec un pied contrôlant la hanche adverse et l'autre protégeant la tête.	1. Position garde côté\n2. Un pied contrôle la hanche adverse\n3. L'autre pied protège la tête\n4. Maintien de la distance	{"Contrôle hanche","Protection tête","Maintien distance"}	5	2026-03-13 14:42:40.215	2026-03-13 14:44:46.655
cmmbmy4u6002lff6dob4aj1ku	cmmbmy4u5002jff6djreiho08	Uppercut poing	FRAPPE_DE_FACE	\N	Coup de poing montant qui part du bas vers le haut, visant généralement le menton ou le plexus solaire. Le coude reste près du corps, le poing tourne à l'impact.	Rotation hanches, montée verticale.	{Rotation,Montée,"Impact menton"}	1	2026-03-04 06:08:13.567	2026-03-13 14:44:46.563
cmmbmy4ua002pff6divzstwyn	cmmbmy4u5002jff6djreiho08	Direct arrière	FRAPPE_DE_FACE	\N	Coup tendu arrière, puissant, utilisant la rotation des hanches. Le bras arrière frappe en ligne droite.	Rotation hanches, extension bras.	{Rotation,Extension,Puissant}	3	2026-03-04 06:08:13.571	2026-03-13 14:44:46.58
cmmbmy4uh002xff6dn0gap68y	cmmbmy4u5002jff6djreiho08	Genou circulaire extérieur	FRAPPE_DE_COTE	\N	Coup de genou en arc vers l'extérieur, utilisé en corps à corps pour viser les flancs ou les côtes.	Monter genou côté, extérieur.	{Montée,Rotation,Côtes}	7	2026-03-04 06:08:13.578	2026-03-13 14:44:46.593
cmmbmy4um0033ff6dvo3hi861	cmmbmy4uj002zff6d0dar61mr	Dégagement poignet droit	SAISISSEMENTS	\N	Rotation du poignet vers l'extérieur combinée à un mouvement de levier pour libérer une saisie de poignet droit.	Rotation extérieure, levier.	{Rotation,Levier,Explosivité}	2	2026-03-04 06:08:13.583	2026-03-13 14:44:46.598
cmmbmy4ut003bff6d3ngh1izd	cmmbmy4uj002zff6d0dar61mr	Dégagement deux poignets	SAISISSEMENTS	\N	Technique de libération quand les deux poignets sont saisis, utilisant un levier combiné avec le coude.	Baisser, ramener bras, tête.	{Baisser,Ramener,Tête}	6	2026-03-04 06:08:13.589	2026-03-13 14:44:46.61
cmmp0adnx00015a2v1o8e5867	cmmbmy4uj002zff6d0dar61mr	Dégagement étranglement avant poussé	DEFENSES_SUR_ATTAQUES_PONCTUELLES	\N	Retrait d'un pas en arrière combiné au levage d'un bras pour casser l'étranglement avant, suivi d'une contre-attaque immédiate.	1. Retirer rapidement un pas en arrière\n2. Lever simultanément un bras pour casser l'étranglement\n3. Contre-attaquer immédiatement	{"Retrait rapide","Lever le bras","Contre-attaque immédiate"}	7	2026-03-13 14:42:40.173	2026-03-13 14:44:46.612
cmmbmy4uz003jff6dpyosfhms	cmmbmy4uv003dff6dq2fjm7lm	Roulade plombée	AUTRES	\N	Roulade avec impact au sol sans se relever, utilisée en situation de combat au sol.	Roulade frappe sol.	{Frappe,Immobiliser,Contrôle}	3	2026-03-04 06:08:13.596	2026-03-13 14:44:46.622
cmmbmy4w8004xff6dqcspugqn	cmmbmy4w6004vff6d0k2vtdws	Roulade plombée	AUTRES	\N	Roulade avec impact au sol sans se relever, utilisée en situation de combat au sol.	Roulade frappe sol.	{Frappe,Immobiliser,Contrôle}	1	2026-03-04 06:08:13.64	2026-03-13 14:44:46.622
cmmp0ador000j5a2vjrlpyrx0	cmmbmy4v1003lff6do3hl7m9q	Parade intérieure riposte même main	DEFENSES_SUR_ATTAQUES_PONCTUELLES	\N	Déviation intérieure du coup adverse avec la paume, suivie immédiatement d'une riposte de la même main.	1. Contre un direct droit: défense paume gauche, riposte direct gauche\n2. Contre un direct gauche: défense paume droite, riposte direct droit\n3. Enchaînement fluide	{"Parade intérieure","Riposte même main","Enchaînement fluide"}	8	2026-03-13 14:42:40.203	2026-03-13 14:44:46.638
cmmbmy4v9003vff6di20n45pc	cmmbmy4v8003tff6d3p0o2f3m	Garde côté	ATTAQUES_AU_SOL	\N	Position défensive au sol sur le côté, une main au sol, jambes repliées prêtes à frapper ou contrôler.	Genou ventre, coude sol.	{Genou,Coude,Hanche}	1	2026-03-04 06:08:13.606	2026-03-13 14:44:46.648
cmmbmy4vd003zff6dtro8qvbo	cmmbmy4v8003tff6d3p0o2f3m	Remontée technique	ATTAQUES_AU_SOL	\N	Technique de remontée depuis le sol vers la position debout en protégeant et en contrôlant l'adversaire.	Mouvement technique, protection.	{Technique,Protection,Défensive}	3	2026-03-04 06:08:13.609	2026-03-13 14:44:46.652
cmmbmy4y8006vff6dnf5ju1ct	cmmbmy4y1006pff6dsp6nsicn	Remontée technique	ATTAQUES_AU_SOL	\N	Technique de remontée depuis le sol vers la position debout en protégeant et en contrôlant l'adversaire.	Technique, protection, remontée.	{Technique,Protection,Remontée}	3	2026-03-04 06:08:13.712	2026-03-13 14:44:46.652
cmmp0adp700115a2vw3d3hp6s	cmmbmy4v8003tff6d3p0o2f3m	Contrôle au sol agresseur plaqué	ATTAQUES_AU_SOL	\N	Techniques de contrôle et de frappe quand l'agresseur est plaqué sur nous: saisies, frappes courtes, sorties.	1. Saisir un bras et la tête de l'agresseur\n2. Frapper: doigts dans les yeux, coups de poing, paume, coude, talon\n3. Sortie: doigts dans les yeux pour repousser, pied hanche/tête ou garde côté	{"Saisie bras et tête","Frappes multiples","Sortie rapide"}	7	2026-03-13 14:42:40.219	2026-03-13 14:44:46.66
cmmp0adp800135a2vhoj8r0o2	cmmbmy4v8003tff6d3p0o2f3m	Saisie chevilles agresseur qui se relève	ATTAQUES_AU_SOL	\N	Saisie des chevilles pour faire tomber l'agresseur qui tente de se relever depuis la garde au sol.	1. Agresseur se relève depuis la garde\n2. Saisie des chevilles\n3. Monter le bassin\n4. Faire tomber l'agresseur\n5. Alternative: si l'agresseur recule une jambe, saisir la cheville proche et crochetage derrière le genou	{"Saisie chevilles","Montée bassin",Déséquilibre,"Crochetage genou"}	8	2026-03-13 14:42:40.221	2026-03-13 14:44:46.661
cmmp0adpa00155a2vvmky9dx5	cmmbmy4ve0041ff6du89dc1ul	Coup pied direct au corps couteau	ATTAQUES_AVEC_ARMES_BLANCHES	\N	Coup de pied direct au corps comme défense contre une attaque au couteau, sans tenter de désarmer.	1. Identifier l'attaque au couteau\n2. Coup de pied direct au corps\n3. Avec ou sans avancée selon distance\n4. Suite selon situation	{"Coup pied direct","Corps comme cible","Pas de désarmement","Adaptation distance"}	3	2026-03-13 14:42:40.223	2026-03-13 14:44:46.667
cmmp0adpc00175a2vczr5q8ax	cmmbmy4ve0041ff6du89dc1ul	Coup pied direct déplacement couteau	ATTAQUES_AVEC_ARMES_BLANCHES	\N	Coup de pied direct combiné à un déplacement latéral pour sortir de la ligne d'attaque du couteau.	1. Se déplacer simultanément du côté opposé au couteau\n2. Coup de pied direct au corps\n3. Sortie de la ligne d'attaque\n4. Suite selon besoin	{"Déplacement latéral","Sortie ligne attaque","Coup pied direct","Pas de désarmement"}	4	2026-03-13 14:42:40.224	2026-03-13 14:44:46.669
cmmp0adpe00195a2v0gnqhxvw	cmmbmy4ve0041ff6du89dc1ul	Coup pied direct menton couteau bas	ATTAQUES_AVEC_ARMES_BLANCHES	\N	Coup de pied direct au menton contre une attaque de couteau de bas en haut.	1. Attaque couteau de bas en haut\n2. Coup de pied direct au menton ou corps\n3. Sans avancée\n4. Suite selon situation	{"Coup pied direct","Menton ou corps","Sans avancée","Pas de désarmement"}	5	2026-03-13 14:42:40.226	2026-03-13 14:44:46.671
cmmp0adpf001b5a2vpmc1g12f	cmmbmy4ve0041ff6du89dc1ul	Coup pied déplacement couteau bas	ATTAQUES_AVEC_ARMES_BLANCHES	\N	Coup de pied direct avec déplacement latéral contre une attaque de couteau montante.	1. Se déplacer du côté opposé au couteau\n2. Coup de pied direct au menton ou corps\n3. Sortie ligne attaque\n4. Suite selon situation et besoin	{"Déplacement latéral","Coup pied direct","Sortie ligne attaque","Pas de désarmement"}	6	2026-03-13 14:42:40.228	2026-03-13 14:44:46.672
cmmp0adp5000z5a2vgxono4a2	cmmbmy4v8003tff6d3p0o2f3m	Ciseaux au sol	ATTAQUES_AU_SOL	\N	Technique de contrôle au sol utilisant les jambes croisées pour immobiliser ou retourner l'adversaire.	1. Position garde côté\n2. Croisement des jambes\n3. Saisie ou contrôle de l'agresseur\n4. Retournement ou maintien	{"Position ciseaux","Croisement jambes","Contrôle adverse"}	6	2026-03-13 14:42:40.217	2026-03-13 14:44:46.657
\.


--
-- Data for Name: TechniqueVideoLink; Type: TABLE DATA; Schema: public; Owner: fekm
--

COPY public."TechniqueVideoLink" (id, "techniqueId", "videoId", "order", "createdAt") FROM stdin;
cmnenf0z90003dnpo4ooc8yb0	cmmbmy4rt0005ff6duu04ami8	cmnenf0z30001dnpomfrjpzoh	0	2026-03-31 13:24:22.581
cmneovdar0007dnpon0hs7ccj	cmmbmy4rw0007ff6d8os4hdfi	cmneovdae0005dnpo0rvr4q24	0	2026-03-31 14:05:04.66
cmnep02jv000bdnpoh1ku3o5w	cmmbmy4s0000bff6dw7kgtlxd	cmnep02ji0009dnpom8gmp1zl	0	2026-03-31 14:08:44.011
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: fekm
--

COPY public."User" (id, name, email, "emailVerified", image, password, role, "beltId", "createdAt", "updatedAt") FROM stdin;
cmmbmy5as009tff6dsx48neqo	Administrateur	admin@fekm.fr	\N	\N	$2b$10$/xJXF3ZnshinJuY5afkal.u6KpK2Profd/R1Saw490FpZi34Nph2u	ADMIN	cmmbmy4rk0000ff6djzybl0v9	2026-03-04 06:08:14.165	2026-03-04 06:08:14.165
cmmdgxh3n0000wg54ugdc35u2	Admin FEKM	admin@fekm.local	\N	\N	$2b$10$3aEqWlrXNQG09.9zZ80nqeb.gse2Nsiy21aE0j4VX.4dPxPRf568e	ADMIN	\N	2026-03-05 12:55:17.459	2026-03-07 19:37:07.649
cmmgrlahf0001s3ppj4dr8icf	Frédéric LEBRETON	frederic@fekm.local	\N	\N	$2b$12$VczHSx0ZmEMxCzPYS2xvFOA0aFhsPV4nBVgJOQhFvP8OQlxvpu1/i	STUDENT	\N	2026-03-07 20:17:03.315	2026-03-07 20:17:03.315
cmnend0ss00001j5gllkdd3z0	Administrateur	admin@fekm.test	2026-03-31 13:22:49.035	\N	$2b$10$jKdeqRkoYgIXBUPWWbN5o.yLRa.kCuBxiJiKaS.2A.I/YmFr41laC	ADMIN	\N	2026-03-31 13:22:49.036	2026-03-31 13:22:49.036
cmmbmy561009rff6dps3lw6pa	Démo Utilisateur	demo@fekm.com	\N	\N	$2b$10$yUGRoN6t6DEjUib2zc6COuyiDVWpcldrU2bjqsra6M/qjR4TQaAJ.	STUDENT	cmmbmy4u1002gff6d3vvx2jbw	2026-03-04 06:08:13.993	2026-03-31 19:08:32.17
cmrw7bwvk0001qw828biaxcca	frederic	johndraper@fekm.fr	\N	\N	$2b$12$J5FvKi3VelUKcsnNi1Qqs.cZvu//GfkDeI.AgyfEn8ySmXp7kVu/W	STUDENT	\N	2026-07-22 14:52:43.944	2026-07-22 14:52:43.944
\.


--
-- Data for Name: UserFavorite; Type: TABLE DATA; Schema: public; Owner: fekm
--

COPY public."UserFavorite" (id, "userId", "techniqueId", "createdAt") FROM stdin;
\.


--
-- Data for Name: UserNote; Type: TABLE DATA; Schema: public; Owner: fekm
--

COPY public."UserNote" (id, "userId", "techniqueId", content, "timestamp", "createdAt", "updatedAt") FROM stdin;
cmmgp1uwn0001118b4k3hem5u	cmmbmy561009rff6dps3lw6pa	cmmbmy4tb001pff6dsi5328bi	Plutot pas mal	\N	2026-03-07 19:05:57.431	2026-03-07 19:05:57.431
cmmovon000004a5c3wugq4kc7	cmmdgxh3n0000wg54ugdc35u2	cmmbmy4se000pff6dj1bloo45	C'était Pas ten' mais là gagné	\N	2026-03-13 12:33:47.376	2026-03-13 12:34:39.168
\.


--
-- Data for Name: UserTechniqueProgress; Type: TABLE DATA; Schema: public; Owner: fekm
--

COPY public."UserTechniqueProgress" (id, "userId", "techniqueId", level, notes, "lastUpdated", "createdAt") FROM stdin;
cmmg067dc0004i931gzd6dgsa	cmmbmy561009rff6dps3lw6pa	cmmbmy4rt0005ff6duu04ami8	NON_ACQUIS		2026-03-07 07:29:29.808	2026-03-07 07:29:29.808
cmmgdxpdm0004cp6u9m0n8xwf	cmmdgxh3n0000wg54ugdc35u2	cmmbmy4sa000lff6dxvkw9ehw	NON_ACQUIS		2026-03-07 13:54:47.866	2026-03-07 13:54:47.866
cmmgp1uwn0001118b4k3hem5u	cmmbmy561009rff6dps3lw6pa	cmmbmy4tb001pff6dsi5328bi	MAITRISE	Plutot pas mal	2026-03-07 19:05:57.431	2026-03-07 19:05:57.431
cmmjb2tqa00048twq33jjgqyr	cmmbmy561009rff6dps3lw6pa	cmmbmy4u6002lff6dob4aj1ku	NON_ACQUIS		2026-03-09 14:58:06.467	2026-03-09 14:58:06.467
cmmovon000004a5c3wugq4kc7	cmmdgxh3n0000wg54ugdc35u2	cmmbmy4se000pff6dj1bloo45	ACQUIS	C'était Pas ten' mais là gagné	2026-03-13 12:34:39.168	2026-03-13 12:33:47.376
cmrykq5dz00019xbdalhtx5jp	cmmbmy561009rff6dps3lw6pa	cmmbmy4s2000dff6dm6yg2h6h	EN_COURS_DAPPRENTISSAGE		2026-07-24 06:43:15.528	2026-07-24 06:43:15.528
\.


--
-- Data for Name: UserTechniqueVideo; Type: TABLE DATA; Schema: public; Owner: fekm
--

COPY public."UserTechniqueVideo" (id, "userId", "techniqueId", "videoId", slot, notes, "createdAt", "updatedAt") FROM stdin;
cmmgbnfyb0002q1a3bnqhxzkk	cmmdgxh3n0000wg54ugdc35u2	cmmbmy4s2000dff6dm6yg2h6h	cmmgbnfy10000q1a3t989btf8	DEBUTANT	\N	2026-03-07 12:50:49.859	2026-03-07 12:50:49.859
cmmgdeote00087ppv3f4f0tma	cmmdgxh3n0000wg54ugdc35u2	cmmbmy4s2000dff6dm6yg2h6h	cmmgdeot500067ppv26th8fo5	PROGRESSION	\N	2026-03-07 13:40:00.675	2026-03-07 13:40:00.675
cmmgdxeei0002cp6ukh1onfcz	cmmdgxh3n0000wg54ugdc35u2	cmmbmy4sa000lff6dxvkw9ehw	cmmgef35v0006e2xfapsnn3lt	PROGRESSION	\N	2026-03-07 13:54:33.642	2026-03-07 14:08:18.893
cmmgf8joo0002hupnqwz4ecaf	cmmbmy5as009tff6dsx48neqo	cmmbmy4sa000lff6dxvkw9ehw	cmmgf8job0000hupnvnpeel16	DEBUTANT	\N	2026-03-07 14:31:13.32	2026-03-07 14:31:13.32
cmmgdrde40005qh2tlf83wu7f	cmmdgxh3n0000wg54ugdc35u2	cmmbmy4sa000lff6dxvkw9ehw	cmmgf965w0003hupnejy67q6c	DEBUTANT	\N	2026-03-07 13:49:52.397	2026-03-07 14:31:42.463
cmmgfn67t00022v6l688m02l0	cmmdgxh3n0000wg54ugdc35u2	cmmbmy4ry0009ff6d76sq859h	cmmgfn67j00002v6l33cr07xw	PROGRESSION	\N	2026-03-07 14:42:35.706	2026-03-07 14:42:35.706
cmmgbolwb0008q1a3eg4iwctk	cmmdgxh3n0000wg54ugdc35u2	cmmbmy4ry0009ff6d76sq859h	cmmgg8oeo00005xny5wkgb6sc	DEBUTANT	\N	2026-03-07 12:51:44.22	2026-03-07 14:59:19.067
cmmjavh1h00028twqofi3kkiy	cmmbmy561009rff6dps3lw6pa	cmmbmy4u6002lff6dob4aj1ku	cmmjavh1500008twqt4tr2yh3	DEBUTANT	\N	2026-03-09 14:52:23.43	2026-03-09 14:52:23.43
cmmovmp8w0002a5c3dxf4njh6	cmmdgxh3n0000wg54ugdc35u2	cmmbmy4se000pff6dj1bloo45	cmmovmp8r0000a5c35i379yyr	DEBUTANT	\N	2026-03-13 12:32:16.977	2026-03-13 12:32:16.977
cmrw7fpdz0004qw82b64z2bk1	cmrw7bwvk0001qw828biaxcca	cmmbmy4rt0005ff6duu04ami8	cmrw7fpdx0002qw82favnwsl9	DEBUTANT	\N	2026-07-22 14:55:40.872	2026-07-22 14:55:40.872
\.


--
-- Data for Name: VerificationToken; Type: TABLE DATA; Schema: public; Owner: fekm
--

COPY public."VerificationToken" (identifier, token, expires) FROM stdin;
\.


--
-- Data for Name: VideoAsset; Type: TABLE DATA; Schema: public; Owner: fekm
--

COPY public."VideoAsset" (id, filename, "originalName", "mimeType", size, path, duration, "createdAt", "updatedAt", description, "processedAt", resolution, status, tags, "thumbnailPath", title, "uploadedById", "viewCount") FROM stdin;
cmmg06ms60005i931wqe7l9os	cmmbmy561009rff6dps3lw6pa_cmmbmy4rt0005ff6duu04ami8_DEBUTANT_1772868589599.mp4	1. Krav Maga Stances.mp4	video/mp4	63459157	uploads/videos/cmmbmy561009rff6dps3lw6pa_cmmbmy4rt0005ff6duu04ami8_DEBUTANT_1772868589599.mp4	\N	2026-03-07 07:29:49.783	2026-03-07 07:29:49.783	\N	\N	\N	PROCESSING	\N	\N	\N	\N	0
cmmgbnqyz0003q1a3hmx4tb1h	cmmdgxh3n0000wg54ugdc35u2_cmmbmy4s2000dff6dm6yg2h6h_DEBUTANT_1772887864138.webm	recording-1772887863274.webm	video/webm	0	uploads/videos/cmmdgxh3n0000wg54ugdc35u2_cmmbmy4s2000dff6dm6yg2h6h_DEBUTANT_1772887864138.webm	\N	2026-03-07 12:51:04.139	2026-03-07 12:51:04.139	\N	\N	\N	PROCESSING	\N	\N	\N	\N	0
cmmgbolw20006q1a39ab2qvif	cmmdgxh3n0000wg54ugdc35u2_cmmbmy4ry0009ff6d76sq859h_DEBUTANT_1772887904208.webm	recording-1772887903297.webm	video/webm	0	uploads/videos/cmmdgxh3n0000wg54ugdc35u2_cmmbmy4ry0009ff6d76sq859h_DEBUTANT_1772887904208.webm	\N	2026-03-07 12:51:44.21	2026-03-07 12:51:44.21	\N	\N	\N	PROCESSING	\N	\N	\N	\N	0
cmmgcnwc70003fv31r4teqqq8	cmmdgxh3n0000wg54ugdc35u2_cmmbmy4s2000dff6dm6yg2h6h_DEBUTANT_1772889550710.webm	recording-1772889549809.webm	video/webm	284016	uploads/videos/cmmdgxh3n0000wg54ugdc35u2_cmmbmy4s2000dff6dm6yg2h6h_DEBUTANT_1772889550710.webm	\N	2026-03-07 13:19:10.712	2026-03-07 13:19:10.712	\N	\N	\N	PROCESSING	\N	\N	\N	\N	0
cmmgculhq0000148csm80k5h0	cmmdgxh3n0000wg54ugdc35u2_cmmbmy4s2000dff6dm6yg2h6h_DEBUTANT_1772889863243.webm	recording-1772889862303.webm	video/webm;codecs=vp9,opus	194492	uploads/videos/cmmdgxh3n0000wg54ugdc35u2_cmmbmy4s2000dff6dm6yg2h6h_DEBUTANT_1772889863243.webm	\N	2026-03-07 13:24:23.246	2026-03-07 13:24:23.246	\N	\N	\N	PROCESSING	\N	\N	\N	\N	0
cmmgd3xpq00005pfhbki3vm59	cmmdgxh3n0000wg54ugdc35u2_cmmbmy4s2000dff6dm6yg2h6h_DEBUTANT_1772890298972.mp4	PXL_20260307_133133209.mp4	video/mp4	4544297	uploads/videos/cmmdgxh3n0000wg54ugdc35u2_cmmbmy4s2000dff6dm6yg2h6h_DEBUTANT_1772890298972.mp4	\N	2026-03-07 13:31:38.99	2026-03-07 13:31:38.99	\N	\N	\N	PROCESSING	\N	\N	\N	\N	0
cmmgddr4n00007ppvdkga43c0	cmmdgxh3n0000wg54ugdc35u2_cmmbmy4s2000dff6dm6yg2h6h_DEBUTANT_1772890757008.mp4	PXL_20260307_133911417.mp4	video/mp4	2841749	uploads/videos/cmmdgxh3n0000wg54ugdc35u2_cmmbmy4s2000dff6dm6yg2h6h_DEBUTANT_1772890757008.mp4	\N	2026-03-07 13:39:17.016	2026-03-07 13:39:17.016	\N	\N	\N	PROCESSING	\N	\N	\N	\N	0
cmmgde68l00037ppv9cqyxng6	cmmdgxh3n0000wg54ugdc35u2_cmmbmy4s2000dff6dm6yg2h6h_DEBUTANT_1772890776594.webm	recording-1772890775669.webm	video/webm;codecs=vp9,opus	863303	uploads/videos/cmmdgxh3n0000wg54ugdc35u2_cmmbmy4s2000dff6dm6yg2h6h_DEBUTANT_1772890776594.webm	\N	2026-03-07 13:39:36.597	2026-03-07 13:39:36.597	\N	\N	\N	PROCESSING	\N	\N	\N	\N	0
cmmgdqsk30000qh2t4wy0akbv	cmmdgxh3n0000wg54ugdc35u2_cmmbmy4s2000dff6dm6yg2h6h_DEBUTANT_1772891365348.mp4	PXL_20260307_134916536.mp4	video/mp4	12534031	uploads/videos/cmmdgxh3n0000wg54ugdc35u2_cmmbmy4s2000dff6dm6yg2h6h_DEBUTANT_1772891365348.mp4	\N	2026-03-07 13:49:25.395	2026-03-07 13:49:25.395	\N	\N	\N	PROCESSING	\N	\N	\N	\N	0
cmmgdrddu0003qh2txltdgrqd	cmmdgxh3n0000wg54ugdc35u2_cmmbmy4sa000lff6dxvkw9ehw_DEBUTANT_1772891392343.mp4	PXL_20260307_134942952.mp4	video/mp4	11979645	uploads/videos/cmmdgxh3n0000wg54ugdc35u2_cmmbmy4sa000lff6dxvkw9ehw_DEBUTANT_1772891392343.mp4	\N	2026-03-07 13:49:52.386	2026-03-07 13:49:52.386	\N	\N	\N	PROCESSING	\N	\N	\N	\N	0
cmmgdxee80000cp6u1wic6u4h	cmmdgxh3n0000wg54ugdc35u2_cmmbmy4sa000lff6dxvkw9ehw_PROGRESSION_1772891673593.mp4	PXL_20260307_135422340.mp4	video/mp4	9836754	uploads/videos/cmmdgxh3n0000wg54ugdc35u2_cmmbmy4sa000lff6dxvkw9ehw_PROGRESSION_1772891673593.mp4	\N	2026-03-07 13:54:33.632	2026-03-07 13:54:33.632	\N	\N	\N	PROCESSING	\N	\N	\N	\N	0
cmmge4c6o0000a37keehalvp1	cmmdgxh3n0000wg54ugdc35u2_cmmbmy4sa000lff6dxvkw9ehw_DEBUTANT_1772891997297.mp4	PXL_20260307_135944643.mp4	video/mp4	15028696	uploads/videos/cmmdgxh3n0000wg54ugdc35u2_cmmbmy4sa000lff6dxvkw9ehw_DEBUTANT_1772891997297.mp4	\N	2026-03-07 13:59:57.36	2026-03-07 13:59:57.36	\N	\N	\N	PROCESSING	\N	\N	\N	\N	0
cmmge4p0k0003a37kvyuynx1w	cmmdgxh3n0000wg54ugdc35u2_cmmbmy4sa000lff6dxvkw9ehw_PROGRESSION_1772892013948.mp4	PXL_20260307_140002855.mp4	video/mp4	12283989	uploads/videos/cmmdgxh3n0000wg54ugdc35u2_cmmbmy4sa000lff6dxvkw9ehw_PROGRESSION_1772892013948.mp4	\N	2026-03-07 14:00:13.988	2026-03-07 14:00:13.988	\N	\N	\N	PROCESSING	\N	\N	\N	\N	0
cmmgeegpp0000e2xfb710bxas	cmmdgxh3n0000wg54ugdc35u2_cmmbmy4sa000lff6dxvkw9ehw_DEBUTANT_1772892469763.mp4	PXL_20260307_140741860.mp4	video/mp4	7301590	uploads/videos/cmmdgxh3n0000wg54ugdc35u2_cmmbmy4sa000lff6dxvkw9ehw_DEBUTANT_1772892469763.mp4	\N	2026-03-07 14:07:49.79	2026-03-07 14:07:49.79	\N	\N	\N	PROCESSING	\N	\N	\N	\N	0
cmmgeepst0003e2xf0e62ispc	cmmdgxh3n0000wg54ugdc35u2_cmmbmy4sa000lff6dxvkw9ehw_DEBUTANT_1772892481547.mp4	PXL_20260307_140755038.mp4	video/mp4	6201094	uploads/videos/cmmdgxh3n0000wg54ugdc35u2_cmmbmy4sa000lff6dxvkw9ehw_DEBUTANT_1772892481547.mp4	\N	2026-03-07 14:08:01.565	2026-03-07 14:08:01.565	\N	\N	\N	PROCESSING	\N	\N	\N	\N	0
cmmgdeot500067ppv26th8fo5	cmmdgxh3n0000wg54ugdc35u2_cmmbmy4s2000dff6dm6yg2h6h_PROGRESSION_1772890800655.mp4	PXL_20260307_133952527.mp4	video/mp4	2768390	uploads/videos/cmmdgxh3n0000wg54ugdc35u2_cmmbmy4s2000dff6dm6yg2h6h_PROGRESSION_1772890800655.mp4	\N	2026-03-07 13:40:00.665	2026-07-24 06:43:02.489	\N	\N	\N	PROCESSING	\N	uploads/thumbnails/cmmgdeot500067ppv26th8fo5.jpg	\N	cmmdgxh3n0000wg54ugdc35u2	0
cmmgbnfy10000q1a3t989btf8	cmmdgxh3n0000wg54ugdc35u2_cmmbmy4s2000dff6dm6yg2h6h_DEBUTANT_1772887849846.webm	recording-1772887848984.webm	video/webm	0	uploads/videos/cmmdgxh3n0000wg54ugdc35u2_cmmbmy4s2000dff6dm6yg2h6h_DEBUTANT_1772887849846.webm	\N	2026-03-07 12:50:49.849	2026-03-07 12:50:49.849	\N	\N	\N	PROCESSING	\N	\N	\N	cmmdgxh3n0000wg54ugdc35u2	0
cmmgef35v0006e2xfapsnn3lt	cmmdgxh3n0000wg54ugdc35u2_cmmbmy4sa000lff6dxvkw9ehw_PROGRESSION_1772892498829.mp4	PXL_20260307_140808400.mp4	video/mp4	15139206	uploads/videos/cmmdgxh3n0000wg54ugdc35u2_cmmbmy4sa000lff6dxvkw9ehw_PROGRESSION_1772892498829.mp4	\N	2026-03-07 14:08:18.883	2026-03-07 14:08:18.883	\N	\N	\N	PROCESSING	\N	\N	\N	cmmdgxh3n0000wg54ugdc35u2	0
cmneovdae0005dnpo0rvr4q24	1a361b27-123d-49ba-bea3-8cbdc9bb8d17.mp4	53816699_2104194196336880_4932571112534966272_n.mp4	video/mp4	84329	uploads/videos/1a361b27-123d-49ba-bea3-8cbdc9bb8d17.mp4	\N	2026-03-31 14:05:04.646	2026-03-31 14:05:04.646	\N	\N	\N	READY	{}	\N	\N	cmnend0ss00001j5gllkdd3z0	0
cmnep02ji0009dnpom8gmp1zl	fd4660a9-c281-492a-ab79-16fe6fc06d79.mp4	53816699_2104194196336880_4932571112534966272_n.mp4	video/mp4	84329	uploads/videos/fd4660a9-c281-492a-ab79-16fe6fc06d79.mp4	\N	2026-03-31 14:08:43.998	2026-03-31 14:08:43.998	\N	\N	\N	READY	{}	\N	\N	cmnend0ss00001j5gllkdd3z0	0
cmmgf8job0000hupnvnpeel16	cmmbmy5as009tff6dsx48neqo_cmmbmy4sa000lff6dxvkw9ehw_DEBUTANT_1772893873305.mp4	53816699_2104194196336880_4932571112534966272_n.mp4	video/mp4	84329	uploads/videos/cmmbmy5as009tff6dsx48neqo_cmmbmy4sa000lff6dxvkw9ehw_DEBUTANT_1772893873305.mp4	\N	2026-03-07 14:31:13.307	2026-04-01 18:43:30.41	\N	\N	\N	PROCESSING	\N	uploads/thumbnails/cmmgf8job0000hupnvnpeel16.jpg	\N	cmmbmy5as009tff6dsx48neqo	0
cmmgf965w0003hupnejy67q6c	cmmdgxh3n0000wg54ugdc35u2_cmmbmy4sa000lff6dxvkw9ehw_DEBUTANT_1772893902403.mp4	PXL_20260307_143128422.mp4	video/mp4	11745466	uploads/videos/cmmdgxh3n0000wg54ugdc35u2_cmmbmy4sa000lff6dxvkw9ehw_DEBUTANT_1772893902403.mp4	\N	2026-03-07 14:31:42.452	2026-03-07 14:31:42.452	\N	\N	\N	PROCESSING	\N	\N	\N	cmmdgxh3n0000wg54ugdc35u2	0
cmmjavh1500008twqt4tr2yh3	cmmbmy561009rff6dps3lw6pa_cmmbmy4u6002lff6dob4aj1ku_DEBUTANT_1773067943374.mp4	VID_20260309_185215.mp4	video/mp4	11335476	uploads/videos/cmmbmy561009rff6dps3lw6pa_cmmbmy4u6002lff6dob4aj1ku_DEBUTANT_1773067943374.mp4	\N	2026-03-09 14:52:23.418	2026-03-09 14:52:23.418	\N	\N	\N	PROCESSING	\N	\N	\N	cmmbmy561009rff6dps3lw6pa	0
cmmovmp8r0000a5c35i379yyr	cmmdgxh3n0000wg54ugdc35u2_cmmbmy4se000pff6dj1bloo45_DEBUTANT_1773405136942.mp4	PXL_20260313_123208904.mp4	video/mp4	6994891	uploads/videos/cmmdgxh3n0000wg54ugdc35u2_cmmbmy4se000pff6dj1bloo45_DEBUTANT_1773405136942.mp4	\N	2026-03-13 12:32:16.972	2026-03-13 12:32:16.972	\N	\N	\N	PROCESSING	\N	\N	\N	cmmdgxh3n0000wg54ugdc35u2	0
cmmgfn67j00002v6l33cr07xw	cmmdgxh3n0000wg54ugdc35u2_cmmbmy4ry0009ff6d76sq859h_PROGRESSION_1772894555658.mp4	PXL_20260307_144225796.mp4	video/mp4	11865892	uploads/videos/cmmdgxh3n0000wg54ugdc35u2_cmmbmy4ry0009ff6d76sq859h_PROGRESSION_1772894555658.mp4	\N	2026-03-07 14:42:35.695	2026-03-13 13:19:12.6	\N	\N	\N	PROCESSING	\N	uploads/thumbnails/cmmgfn67j00002v6l33cr07xw.jpg	\N	cmmdgxh3n0000wg54ugdc35u2	0
cmmgg8oeo00005xny5wkgb6sc	cmmdgxh3n0000wg54ugdc35u2_cmmbmy4ry0009ff6d76sq859h_DEBUTANT_1772895559012.mp4	PXL_20260307_145909234.mp4	video/mp4	13484439	uploads/videos/cmmdgxh3n0000wg54ugdc35u2_cmmbmy4ry0009ff6d76sq859h_DEBUTANT_1772895559012.mp4	\N	2026-03-07 14:59:19.056	2026-03-13 13:19:12.602	\N	\N	\N	PROCESSING	\N	uploads/thumbnails/cmmgg8oeo00005xny5wkgb6sc.jpg	\N	cmmdgxh3n0000wg54ugdc35u2	0
cmrw7fpdx0002qw82favnwsl9	cmrw7bwvk0001qw828biaxcca_cmmbmy4rt0005ff6duu04ami8_DEBUTANT_1784732140480.mp4	1000017925.mp4	video/mp4	5971534	uploads/videos/cmrw7bwvk0001qw828biaxcca_cmmbmy4rt0005ff6duu04ami8_DEBUTANT_1784732140480.mp4	\N	2026-07-22 14:55:40.869	2026-07-22 14:55:40.869	\N	\N	\N	PROCESSING	\N	uploads/thumbnails/1784732140480.jpg	\N	cmrw7bwvk0001qw828biaxcca	0
cmnenf0z30001dnpomfrjpzoh	11840dae-19a9-4115-9316-298451a15e8e.mp4	53816699_2104194196336880_4932571112534966272_n.mp4	video/mp4	84329	uploads/videos/11840dae-19a9-4115-9316-298451a15e8e.mp4	\N	2026-03-31 13:24:22.575	2026-07-24 06:09:41.43	\N	\N	\N	READY	{}	uploads/thumbnails/cmnenf0z30001dnpomfrjpzoh.jpg	\N	cmnend0ss00001j5gllkdd3z0	0
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: fekm
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
fdb19dde-138d-4638-ac62-76e00bf6430a	5d504df5f627e5849531522849be377d03dd00f447e48ceae46ebd740b6ebdcc	2026-03-03 19:04:01.331949+00	20260303190401_init	\N	\N	2026-03-03 19:04:01.252094+00	1
26d40c8e-9239-4524-a523-e3bb461c5944	fd0a126c114f991cb619c03b70c0f9d68a7412cfd1f033cc4f8d76ed13e4eaa9	\N	20250313_add_user_notes	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20250313_add_user_notes\n\nDatabase error code: 42P07\n\nDatabase error:\nERROR: relation "UserNote" already exists\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42P07), message: "relation \\"UserNote\\" already exists", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("heap.c"), line: Some(1150), routine: Some("heap_create_with_catalog") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20250313_add_user_notes"\n             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:106\n   1: schema_core::commands::apply_migrations::Applying migration\n           with migration_name="20250313_add_user_notes"\n             at schema-engine/core/src/commands/apply_migrations.rs:91\n   2: schema_core::state::ApplyMigrations\n             at schema-engine/core/src/state.rs:226	2026-03-13 09:04:19.813488+00	2026-03-13 09:04:10.675048+00	0
4963f143-0da6-4423-963c-fbe767c2325d	5cc43708259af2c38caaaed5233ea34c2f09e65f694eb6ed05fe9ef07f10d949	\N	20250305_add_mobile_video_features	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20250305_add_mobile_video_features\n\nDatabase error code: 42710\n\nDatabase error:\nERROR: type "VideoStatus" already exists\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42710), message: "type \\"VideoStatus\\" already exists", detail: None, hint: None, position: None, where_: Some("SQL statement \\"CREATE TYPE \\"VideoStatus\\" AS ENUM ('PENDING', 'PROCESSING', 'READY', 'ERROR')\\"\\nPL/pgSQL function inline_code_block line 4 at SQL statement"), schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("typecmds.c"), line: Some(1167), routine: Some("DefineEnum") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20250305_add_mobile_video_features"\n             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:106\n   1: schema_core::commands::apply_migrations::Applying migration\n           with migration_name="20250305_add_mobile_video_features"\n             at schema-engine/core/src/commands/apply_migrations.rs:91\n   2: schema_core::state::ApplyMigrations\n             at schema-engine/core/src/state.rs:226	2026-03-13 09:03:44.540698+00	2026-03-13 09:03:33.790701+00	0
f64e34d1-2ed5-4c7e-b7ce-3a15b925b7f7	5cc43708259af2c38caaaed5233ea34c2f09e65f694eb6ed05fe9ef07f10d949	2026-03-13 09:03:44.542456+00	20250305_add_mobile_video_features		\N	2026-03-13 09:03:44.542456+00	0
e47ae07d-5074-4e81-a0fa-f9a6681b04d2	fd0a126c114f991cb619c03b70c0f9d68a7412cfd1f033cc4f8d76ed13e4eaa9	2026-03-13 09:04:19.823084+00	20250313_add_user_notes		\N	2026-03-13 09:04:19.823084+00	0
927589d2-0edb-4be4-8d81-e4fbc31a0e9e	3463e424b740a1179fd6091850bcb3e75b0ae36f680bc8a5aaa68bcbf656847f	\N	20250307_add_belt_history	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20250307_add_belt_history\n\nDatabase error code: 42710\n\nDatabase error:\nERROR: constraint "BeltHistory_userId_fkey" for relation "BeltHistory" already exists\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42710), message: "constraint \\"BeltHistory_userId_fkey\\" for relation \\"BeltHistory\\" already exists", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("tablecmds.c"), line: Some(9011), routine: Some("ATExecAddConstraint") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20250307_add_belt_history"\n             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:106\n   1: schema_core::commands::apply_migrations::Applying migration\n           with migration_name="20250307_add_belt_history"\n             at schema-engine/core/src/commands/apply_migrations.rs:91\n   2: schema_core::state::ApplyMigrations\n             at schema-engine/core/src/state.rs:226	2026-03-13 09:04:02.478947+00	2026-03-13 09:03:55.459328+00	0
f49cee71-e679-4b6f-a33f-55139b86c760	3463e424b740a1179fd6091850bcb3e75b0ae36f680bc8a5aaa68bcbf656847f	2026-03-13 09:04:02.49107+00	20250307_add_belt_history		\N	2026-03-13 09:04:02.49107+00	0
\.


--
-- Name: Account Account_pkey; Type: CONSTRAINT; Schema: public; Owner: fekm
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_pkey" PRIMARY KEY (id);


--
-- Name: BeltContent BeltContent_pkey; Type: CONSTRAINT; Schema: public; Owner: fekm
--

ALTER TABLE ONLY public."BeltContent"
    ADD CONSTRAINT "BeltContent_pkey" PRIMARY KEY (id);


--
-- Name: BeltHistory BeltHistory_pkey; Type: CONSTRAINT; Schema: public; Owner: fekm
--

ALTER TABLE ONLY public."BeltHistory"
    ADD CONSTRAINT "BeltHistory_pkey" PRIMARY KEY (id);


--
-- Name: Belt Belt_pkey; Type: CONSTRAINT; Schema: public; Owner: fekm
--

ALTER TABLE ONLY public."Belt"
    ADD CONSTRAINT "Belt_pkey" PRIMARY KEY (id);


--
-- Name: Module Module_pkey; Type: CONSTRAINT; Schema: public; Owner: fekm
--

ALTER TABLE ONLY public."Module"
    ADD CONSTRAINT "Module_pkey" PRIMARY KEY (id);


--
-- Name: Session Session_pkey; Type: CONSTRAINT; Schema: public; Owner: fekm
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_pkey" PRIMARY KEY (id);


--
-- Name: TechniqueVideoLink TechniqueVideoLink_pkey; Type: CONSTRAINT; Schema: public; Owner: fekm
--

ALTER TABLE ONLY public."TechniqueVideoLink"
    ADD CONSTRAINT "TechniqueVideoLink_pkey" PRIMARY KEY (id);


--
-- Name: Technique Technique_pkey; Type: CONSTRAINT; Schema: public; Owner: fekm
--

ALTER TABLE ONLY public."Technique"
    ADD CONSTRAINT "Technique_pkey" PRIMARY KEY (id);


--
-- Name: UserFavorite UserFavorite_pkey; Type: CONSTRAINT; Schema: public; Owner: fekm
--

ALTER TABLE ONLY public."UserFavorite"
    ADD CONSTRAINT "UserFavorite_pkey" PRIMARY KEY (id);


--
-- Name: UserFavorite UserFavorite_userId_techniqueId_key; Type: CONSTRAINT; Schema: public; Owner: fekm
--

ALTER TABLE ONLY public."UserFavorite"
    ADD CONSTRAINT "UserFavorite_userId_techniqueId_key" UNIQUE ("userId", "techniqueId");


--
-- Name: UserNote UserNote_pkey; Type: CONSTRAINT; Schema: public; Owner: fekm
--

ALTER TABLE ONLY public."UserNote"
    ADD CONSTRAINT "UserNote_pkey" PRIMARY KEY (id);


--
-- Name: UserTechniqueProgress UserTechniqueProgress_pkey; Type: CONSTRAINT; Schema: public; Owner: fekm
--

ALTER TABLE ONLY public."UserTechniqueProgress"
    ADD CONSTRAINT "UserTechniqueProgress_pkey" PRIMARY KEY (id);


--
-- Name: UserTechniqueVideo UserTechniqueVideo_pkey; Type: CONSTRAINT; Schema: public; Owner: fekm
--

ALTER TABLE ONLY public."UserTechniqueVideo"
    ADD CONSTRAINT "UserTechniqueVideo_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: fekm
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: VideoAsset VideoAsset_pkey; Type: CONSTRAINT; Schema: public; Owner: fekm
--

ALTER TABLE ONLY public."VideoAsset"
    ADD CONSTRAINT "VideoAsset_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: fekm
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: Account_provider_providerAccountId_key; Type: INDEX; Schema: public; Owner: fekm
--

CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON public."Account" USING btree (provider, "providerAccountId");


--
-- Name: BeltContent_beltId_key; Type: INDEX; Schema: public; Owner: fekm
--

CREATE UNIQUE INDEX "BeltContent_beltId_key" ON public."BeltContent" USING btree ("beltId");


--
-- Name: BeltHistory_beltId_idx; Type: INDEX; Schema: public; Owner: fekm
--

CREATE INDEX "BeltHistory_beltId_idx" ON public."BeltHistory" USING btree ("beltId");


--
-- Name: BeltHistory_promotedBy_idx; Type: INDEX; Schema: public; Owner: fekm
--

CREATE INDEX "BeltHistory_promotedBy_idx" ON public."BeltHistory" USING btree ("promotedBy");


--
-- Name: BeltHistory_userId_idx; Type: INDEX; Schema: public; Owner: fekm
--

CREATE INDEX "BeltHistory_userId_idx" ON public."BeltHistory" USING btree ("userId");


--
-- Name: Belt_name_key; Type: INDEX; Schema: public; Owner: fekm
--

CREATE UNIQUE INDEX "Belt_name_key" ON public."Belt" USING btree (name);


--
-- Name: Session_sessionToken_key; Type: INDEX; Schema: public; Owner: fekm
--

CREATE UNIQUE INDEX "Session_sessionToken_key" ON public."Session" USING btree ("sessionToken");


--
-- Name: TechniqueVideoLink_techniqueId_videoId_key; Type: INDEX; Schema: public; Owner: fekm
--

CREATE UNIQUE INDEX "TechniqueVideoLink_techniqueId_videoId_key" ON public."TechniqueVideoLink" USING btree ("techniqueId", "videoId");


--
-- Name: UserFavorite_techniqueId_idx; Type: INDEX; Schema: public; Owner: fekm
--

CREATE INDEX "UserFavorite_techniqueId_idx" ON public."UserFavorite" USING btree ("techniqueId");


--
-- Name: UserFavorite_userId_idx; Type: INDEX; Schema: public; Owner: fekm
--

CREATE INDEX "UserFavorite_userId_idx" ON public."UserFavorite" USING btree ("userId");


--
-- Name: UserNote_techniqueId_idx; Type: INDEX; Schema: public; Owner: fekm
--

CREATE INDEX "UserNote_techniqueId_idx" ON public."UserNote" USING btree ("techniqueId");


--
-- Name: UserNote_userId_idx; Type: INDEX; Schema: public; Owner: fekm
--

CREATE INDEX "UserNote_userId_idx" ON public."UserNote" USING btree ("userId");


--
-- Name: UserNote_userId_techniqueId_idx; Type: INDEX; Schema: public; Owner: fekm
--

CREATE INDEX "UserNote_userId_techniqueId_idx" ON public."UserNote" USING btree ("userId", "techniqueId");


--
-- Name: UserTechniqueProgress_userId_techniqueId_key; Type: INDEX; Schema: public; Owner: fekm
--

CREATE UNIQUE INDEX "UserTechniqueProgress_userId_techniqueId_key" ON public."UserTechniqueProgress" USING btree ("userId", "techniqueId");


--
-- Name: UserTechniqueVideo_userId_techniqueId_slot_key; Type: INDEX; Schema: public; Owner: fekm
--

CREATE UNIQUE INDEX "UserTechniqueVideo_userId_techniqueId_slot_key" ON public."UserTechniqueVideo" USING btree ("userId", "techniqueId", slot);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: fekm
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: VerificationToken_identifier_token_key; Type: INDEX; Schema: public; Owner: fekm
--

CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON public."VerificationToken" USING btree (identifier, token);


--
-- Name: VerificationToken_token_key; Type: INDEX; Schema: public; Owner: fekm
--

CREATE UNIQUE INDEX "VerificationToken_token_key" ON public."VerificationToken" USING btree (token);


--
-- Name: VideoAsset_createdAt_idx; Type: INDEX; Schema: public; Owner: fekm
--

CREATE INDEX "VideoAsset_createdAt_idx" ON public."VideoAsset" USING btree ("createdAt");


--
-- Name: VideoAsset_status_idx; Type: INDEX; Schema: public; Owner: fekm
--

CREATE INDEX "VideoAsset_status_idx" ON public."VideoAsset" USING btree (status);


--
-- Name: VideoAsset_uploadedById_idx; Type: INDEX; Schema: public; Owner: fekm
--

CREATE INDEX "VideoAsset_uploadedById_idx" ON public."VideoAsset" USING btree ("uploadedById");


--
-- Name: Account Account_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fekm
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: BeltContent BeltContent_beltId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fekm
--

ALTER TABLE ONLY public."BeltContent"
    ADD CONSTRAINT "BeltContent_beltId_fkey" FOREIGN KEY ("beltId") REFERENCES public."Belt"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: BeltHistory BeltHistory_beltId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fekm
--

ALTER TABLE ONLY public."BeltHistory"
    ADD CONSTRAINT "BeltHistory_beltId_fkey" FOREIGN KEY ("beltId") REFERENCES public."Belt"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: BeltHistory BeltHistory_promotedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fekm
--

ALTER TABLE ONLY public."BeltHistory"
    ADD CONSTRAINT "BeltHistory_promotedBy_fkey" FOREIGN KEY ("promotedBy") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: BeltHistory BeltHistory_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fekm
--

ALTER TABLE ONLY public."BeltHistory"
    ADD CONSTRAINT "BeltHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Module Module_beltId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fekm
--

ALTER TABLE ONLY public."Module"
    ADD CONSTRAINT "Module_beltId_fkey" FOREIGN KEY ("beltId") REFERENCES public."Belt"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Session Session_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fekm
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TechniqueVideoLink TechniqueVideoLink_techniqueId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fekm
--

ALTER TABLE ONLY public."TechniqueVideoLink"
    ADD CONSTRAINT "TechniqueVideoLink_techniqueId_fkey" FOREIGN KEY ("techniqueId") REFERENCES public."Technique"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TechniqueVideoLink TechniqueVideoLink_videoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fekm
--

ALTER TABLE ONLY public."TechniqueVideoLink"
    ADD CONSTRAINT "TechniqueVideoLink_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES public."VideoAsset"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Technique Technique_moduleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fekm
--

ALTER TABLE ONLY public."Technique"
    ADD CONSTRAINT "Technique_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES public."Module"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserFavorite UserFavorite_techniqueId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fekm
--

ALTER TABLE ONLY public."UserFavorite"
    ADD CONSTRAINT "UserFavorite_techniqueId_fkey" FOREIGN KEY ("techniqueId") REFERENCES public."Technique"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserFavorite UserFavorite_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fekm
--

ALTER TABLE ONLY public."UserFavorite"
    ADD CONSTRAINT "UserFavorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserNote UserNote_techniqueId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fekm
--

ALTER TABLE ONLY public."UserNote"
    ADD CONSTRAINT "UserNote_techniqueId_fkey" FOREIGN KEY ("techniqueId") REFERENCES public."Technique"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserNote UserNote_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fekm
--

ALTER TABLE ONLY public."UserNote"
    ADD CONSTRAINT "UserNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserTechniqueProgress UserTechniqueProgress_techniqueId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fekm
--

ALTER TABLE ONLY public."UserTechniqueProgress"
    ADD CONSTRAINT "UserTechniqueProgress_techniqueId_fkey" FOREIGN KEY ("techniqueId") REFERENCES public."Technique"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserTechniqueProgress UserTechniqueProgress_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fekm
--

ALTER TABLE ONLY public."UserTechniqueProgress"
    ADD CONSTRAINT "UserTechniqueProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserTechniqueVideo UserTechniqueVideo_techniqueId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fekm
--

ALTER TABLE ONLY public."UserTechniqueVideo"
    ADD CONSTRAINT "UserTechniqueVideo_techniqueId_fkey" FOREIGN KEY ("techniqueId") REFERENCES public."Technique"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserTechniqueVideo UserTechniqueVideo_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fekm
--

ALTER TABLE ONLY public."UserTechniqueVideo"
    ADD CONSTRAINT "UserTechniqueVideo_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserTechniqueVideo UserTechniqueVideo_videoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fekm
--

ALTER TABLE ONLY public."UserTechniqueVideo"
    ADD CONSTRAINT "UserTechniqueVideo_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES public."VideoAsset"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: User User_beltId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fekm
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_beltId_fkey" FOREIGN KEY ("beltId") REFERENCES public."Belt"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: VideoAsset VideoAsset_uploadedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fekm
--

ALTER TABLE ONLY public."VideoAsset"
    ADD CONSTRAINT "VideoAsset_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict sZ0cMbdwLKTJfxfEq4zeD0aRKtft9Wbh8yp7pxtkPCebQJUtbJ1ZezZz4MLuACr

