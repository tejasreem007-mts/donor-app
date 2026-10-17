-- ============================================================
-- Blood & Organ Donor Matching System: tables.sql
-- Oracle 12c+ (uses identity columns). Run with F5 (Run Script).
-- ============================================================

-- Optional clean re-run: uncomment to drop everything first
-- DROP TABLE donation_match       CASCADE CONSTRAINTS;
-- DROP TABLE donation_request     CASCADE CONSTRAINTS;
-- DROP TABLE blood_donation       CASCADE CONSTRAINTS;
-- DROP TABLE donor_organ          CASCADE CONSTRAINTS;
-- DROP TABLE recipient            CASCADE CONSTRAINTS;
-- DROP TABLE donor                CASCADE CONSTRAINTS;
-- DROP TABLE organ_type           CASCADE CONSTRAINTS;
-- DROP TABLE blood_compatibility  CASCADE CONSTRAINTS;
-- DROP TABLE hospital             CASCADE CONSTRAINTS;

-- ------------------------------------------------------------
-- 1. HOSPITAL
-- ------------------------------------------------------------
CREATE TABLE hospital (
    hospital_id   NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name          VARCHAR2(100) NOT NULL,
    city          VARCHAR2(50)  NOT NULL,
    state         VARCHAR2(50),
    phone         VARCHAR2(15),
    has_transplant_unit CHAR(1) DEFAULT 'N' NOT NULL,
    CONSTRAINT chk_hosp_transplant CHECK (has_transplant_unit IN ('Y','N'))
);

-- ------------------------------------------------------------
-- 2. BLOOD_COMPATIBILITY (lookup: who can give to whom)
-- ------------------------------------------------------------
CREATE TABLE blood_compatibility (
    donor_group     VARCHAR2(3) NOT NULL,
    recipient_group VARCHAR2(3) NOT NULL,
    CONSTRAINT pk_blood_compat PRIMARY KEY (donor_group, recipient_group),
    CONSTRAINT chk_bc_donor CHECK (donor_group IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
    CONSTRAINT chk_bc_recip CHECK (recipient_group IN ('A+','A-','B+','B-','AB+','AB-','O+','O-'))
);

-- ------------------------------------------------------------
-- 3. ORGAN_TYPE (lookup)
-- ------------------------------------------------------------
CREATE TABLE organ_type (
    organ_id    NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    organ_name  VARCHAR2(30) NOT NULL UNIQUE
);

-- ------------------------------------------------------------
-- 4. DONOR
-- ------------------------------------------------------------
CREATE TABLE donor (
    donor_id           NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    full_name          VARCHAR2(100) NOT NULL,
    dob                DATE          NOT NULL,
    gender             CHAR(1)       NOT NULL,
    blood_group        VARCHAR2(3)   NOT NULL,
    phone              VARCHAR2(15)  NOT NULL,
    email              VARCHAR2(100) UNIQUE,
    city               VARCHAR2(50)  NOT NULL,
    registered_on      DATE DEFAULT SYSDATE NOT NULL,
    last_donation_date DATE,
    is_available       CHAR(1) DEFAULT 'Y' NOT NULL,
    CONSTRAINT chk_donor_gender CHECK (gender IN ('M','F','O')),
    CONSTRAINT chk_donor_bg     CHECK (blood_group IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
    CONSTRAINT chk_donor_avail  CHECK (is_available IN ('Y','N'))
);

-- ------------------------------------------------------------
-- 5. DONOR_ORGAN (organs a donor has pledged)
-- ------------------------------------------------------------
CREATE TABLE donor_organ (
    donor_id   NUMBER NOT NULL,
    organ_id   NUMBER NOT NULL,
    pledged_on DATE DEFAULT SYSDATE NOT NULL,
    status     VARCHAR2(15) DEFAULT 'PLEDGED' NOT NULL,
    CONSTRAINT pk_donor_organ PRIMARY KEY (donor_id, organ_id),
    CONSTRAINT fk_do_donor FOREIGN KEY (donor_id) REFERENCES donor(donor_id) ON DELETE CASCADE,
    CONSTRAINT fk_do_organ FOREIGN KEY (organ_id) REFERENCES organ_type(organ_id),
    CONSTRAINT chk_do_status CHECK (status IN ('PLEDGED','ALLOCATED','DONATED','WITHDRAWN'))
);

-- ------------------------------------------------------------
-- 6. BLOOD_DONATION (history, used for the 90 day eligibility rule)
-- ------------------------------------------------------------
CREATE TABLE blood_donation (
    donation_id    NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    donor_id       NUMBER NOT NULL,
    hospital_id    NUMBER NOT NULL,
    donation_date  DATE DEFAULT SYSDATE NOT NULL,
    units          NUMBER(2) DEFAULT 1 NOT NULL,
    CONSTRAINT fk_bd_donor    FOREIGN KEY (donor_id)    REFERENCES donor(donor_id),
    CONSTRAINT fk_bd_hospital FOREIGN KEY (hospital_id) REFERENCES hospital(hospital_id),
    CONSTRAINT chk_bd_units   CHECK (units > 0)
);

-- ------------------------------------------------------------
-- 7. RECIPIENT
-- ------------------------------------------------------------
CREATE TABLE recipient (
    recipient_id   NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    full_name      VARCHAR2(100) NOT NULL,
    dob            DATE          NOT NULL,
    gender         CHAR(1)       NOT NULL,
    blood_group    VARCHAR2(3)   NOT NULL,
    phone          VARCHAR2(15)  NOT NULL,
    city           VARCHAR2(50)  NOT NULL,
    hospital_id    NUMBER        NOT NULL,
    registered_on  DATE DEFAULT SYSDATE NOT NULL,
    CONSTRAINT fk_rec_hospital FOREIGN KEY (hospital_id) REFERENCES hospital(hospital_id),
    CONSTRAINT chk_rec_gender  CHECK (gender IN ('M','F','O')),
    CONSTRAINT chk_rec_bg      CHECK (blood_group IN ('A+','A-','B+','B-','AB+','AB-','O+','O-'))
);

-- ------------------------------------------------------------
-- 8. DONATION_REQUEST (a recipient needs blood or an organ)
-- ------------------------------------------------------------
CREATE TABLE donation_request (
    request_id     NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    recipient_id   NUMBER NOT NULL,
    request_type   VARCHAR2(5) NOT NULL,
    organ_id       NUMBER,
    units_needed   NUMBER(2) DEFAULT 1,
    urgency        NUMBER(1) DEFAULT 3 NOT NULL,
    status         VARCHAR2(10) DEFAULT 'OPEN' NOT NULL,
    requested_on   DATE DEFAULT SYSDATE NOT NULL,
    CONSTRAINT fk_req_recipient FOREIGN KEY (recipient_id) REFERENCES recipient(recipient_id),
    CONSTRAINT fk_req_organ     FOREIGN KEY (organ_id)     REFERENCES organ_type(organ_id),
    CONSTRAINT chk_req_type     CHECK (request_type IN ('BLOOD','ORGAN')),
    CONSTRAINT chk_req_urgency  CHECK (urgency BETWEEN 1 AND 5),
    CONSTRAINT chk_req_status   CHECK (status IN ('OPEN','MATCHED','FULFILLED','CANCELLED')),
    CONSTRAINT chk_req_organ_rule CHECK (
        (request_type = 'ORGAN' AND organ_id IS NOT NULL) OR
        (request_type = 'BLOOD' AND organ_id IS NULL)
    )
);

-- ------------------------------------------------------------
-- 9. DONATION_MATCH (output of the PL/SQL matching logic)
-- ------------------------------------------------------------
CREATE TABLE donation_match (
    match_id    NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    request_id  NUMBER NOT NULL,
    donor_id    NUMBER NOT NULL,
    matched_on  DATE DEFAULT SYSDATE NOT NULL,
    status      VARCHAR2(10) DEFAULT 'PROPOSED' NOT NULL,
    CONSTRAINT fk_dm_request FOREIGN KEY (request_id) REFERENCES donation_request(request_id),
    CONSTRAINT fk_dm_donor   FOREIGN KEY (donor_id)   REFERENCES donor(donor_id),
    CONSTRAINT uq_dm_pair    UNIQUE (request_id, donor_id),
    CONSTRAINT chk_dm_status CHECK (status IN ('PROPOSED','ACCEPTED','REJECTED','COMPLETED'))
);

-- ------------------------------------------------------------
-- Indexes on columns the matching queries will filter by
-- ------------------------------------------------------------
CREATE INDEX idx_donor_bg_city  ON donor(blood_group, city);
CREATE INDEX idx_req_status     ON donation_request(status, request_type);
CREATE INDEX idx_bd_donor_date  ON blood_donation(donor_id, donation_date);

-- ------------------------------------------------------------
-- Seed data for the two lookup tables
-- ------------------------------------------------------------
INSERT ALL
    -- O- gives to everyone
    INTO blood_compatibility VALUES ('O-','O-')
    INTO blood_compatibility VALUES ('O-','O+')
    INTO blood_compatibility VALUES ('O-','A-')
    INTO blood_compatibility VALUES ('O-','A+')
    INTO blood_compatibility VALUES ('O-','B-')
    INTO blood_compatibility VALUES ('O-','B+')
    INTO blood_compatibility VALUES ('O-','AB-')
    INTO blood_compatibility VALUES ('O-','AB+')
    -- O+
    INTO blood_compatibility VALUES ('O+','O+')
    INTO blood_compatibility VALUES ('O+','A+')
    INTO blood_compatibility VALUES ('O+','B+')
    INTO blood_compatibility VALUES ('O+','AB+')
    -- A-
    INTO blood_compatibility VALUES ('A-','A-')
    INTO blood_compatibility VALUES ('A-','A+')
    INTO blood_compatibility VALUES ('A-','AB-')
    INTO blood_compatibility VALUES ('A-','AB+')
    -- A+
    INTO blood_compatibility VALUES ('A+','A+')
    INTO blood_compatibility VALUES ('A+','AB+')
    -- B-
    INTO blood_compatibility VALUES ('B-','B-')
    INTO blood_compatibility VALUES ('B-','B+')
    INTO blood_compatibility VALUES ('B-','AB-')
    INTO blood_compatibility VALUES ('B-','AB+')
    -- B+
    INTO blood_compatibility VALUES ('B+','B+')
    INTO blood_compatibility VALUES ('B+','AB+')
    -- AB-
    INTO blood_compatibility VALUES ('AB-','AB-')
    INTO blood_compatibility VALUES ('AB-','AB+')
    -- AB+
    INTO blood_compatibility VALUES ('AB+','AB+')
SELECT * FROM dual;

INSERT INTO organ_type (organ_name) VALUES ('Kidney');
INSERT INTO organ_type (organ_name) VALUES ('Liver');
INSERT INTO organ_type (organ_name) VALUES ('Heart');
INSERT INTO organ_type (organ_name) VALUES ('Lung');
INSERT INTO organ_type (organ_name) VALUES ('Pancreas');
INSERT INTO organ_type (organ_name) VALUES ('Cornea');

COMMIT;
