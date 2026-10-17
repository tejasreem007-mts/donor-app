-- ============================================================
-- procedures.sql : PL/SQL functions and procedures
-- Run AFTER tables.sql and triggers.sql
-- Use F5 (Run Script) in SQL Developer
-- ============================================================

-- ------------------------------------------------------------
-- FUNCTION: is_eligible_blood_donor
-- Returns 'Y' if donor is available, aged 18 to 65 and has not
-- donated in the last 90 days. Otherwise 'N'.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_eligible_blood_donor (p_donor_id IN NUMBER)
RETURN VARCHAR2
IS
    v_donor donor%ROWTYPE;
    v_age   NUMBER;
BEGIN
    SELECT * INTO v_donor FROM donor WHERE donor_id = p_donor_id;

    v_age := FLOOR(MONTHS_BETWEEN(SYSDATE, v_donor.dob) / 12);

    IF v_donor.is_available = 'Y'
       AND v_age BETWEEN 18 AND 65
       AND (v_donor.last_donation_date IS NULL
            OR SYSDATE - v_donor.last_donation_date >= 90)
    THEN
        RETURN 'Y';
    END IF;

    RETURN 'N';
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RETURN 'N';
END is_eligible_blood_donor;
/

-- ------------------------------------------------------------
-- PROCEDURE: register_donor
-- Adds a donor and returns the new donor_id.
-- ------------------------------------------------------------
CREATE OR REPLACE PROCEDURE register_donor (
    p_full_name   IN  VARCHAR2,
    p_dob         IN  DATE,
    p_gender      IN  CHAR,
    p_blood_group IN  VARCHAR2,
    p_phone       IN  VARCHAR2,
    p_email       IN  VARCHAR2,
    p_city        IN  VARCHAR2,
    p_donor_id    OUT NUMBER
)
AS
BEGIN
    INSERT INTO donor (full_name, dob, gender, blood_group, phone, email, city)
    VALUES (p_full_name, p_dob, p_gender, p_blood_group, p_phone, p_email, p_city)
    RETURNING donor_id INTO p_donor_id;
END register_donor;
/

-- ------------------------------------------------------------
-- PROCEDURE: pledge_organ
-- Records that a donor pledges an organ (by organ name).
-- ------------------------------------------------------------
CREATE OR REPLACE PROCEDURE pledge_organ (
    p_donor_id   IN NUMBER,
    p_organ_name IN VARCHAR2
)
AS
BEGIN
    INSERT INTO donor_organ (donor_id, organ_id)
    SELECT p_donor_id, organ_id
    FROM organ_type
    WHERE LOWER(organ_name) = LOWER(p_organ_name);

    IF SQL%ROWCOUNT = 0 THEN
        RAISE_APPLICATION_ERROR(-20020, 'Unknown organ: ' || p_organ_name);
    END IF;
END pledge_organ;
/

-- ------------------------------------------------------------
-- PROCEDURE: record_blood_donation
-- The trigger trg_blood_donation_rules enforces the 90 day rule.
-- ------------------------------------------------------------
CREATE OR REPLACE PROCEDURE record_blood_donation (
    p_donor_id    IN NUMBER,
    p_hospital_id IN NUMBER,
    p_units       IN NUMBER DEFAULT 1
)
AS
BEGIN
    INSERT INTO blood_donation (donor_id, hospital_id, units)
    VALUES (p_donor_id, p_hospital_id, p_units);
END record_blood_donation;
/

-- ------------------------------------------------------------
-- PROCEDURE: match_blood_request
-- Finds eligible, blood-compatible donors for a BLOOD request and
-- inserts them into donation_match.
-- Ranking: same city first, exact blood group next, then donors
-- who have waited longest since their last donation.
-- ------------------------------------------------------------
CREATE OR REPLACE PROCEDURE match_blood_request (
    p_request_id  IN NUMBER,
    p_max_matches IN NUMBER DEFAULT 5
)
AS
    v_req   donation_request%ROWTYPE;
    v_rec   recipient%ROWTYPE;
    v_count NUMBER := 0;
BEGIN
    SELECT * INTO v_req FROM donation_request WHERE request_id = p_request_id;

    IF v_req.request_type <> 'BLOOD' THEN
        RAISE_APPLICATION_ERROR(-20010, 'Request ' || p_request_id || ' is not a blood request');
    END IF;
    IF v_req.status <> 'OPEN' THEN
        RAISE_APPLICATION_ERROR(-20011, 'Request ' || p_request_id || ' is not OPEN');
    END IF;

    SELECT * INTO v_rec FROM recipient WHERE recipient_id = v_req.recipient_id;

    FOR d IN (
        SELECT dn.donor_id, dn.full_name, dn.blood_group, dn.city
        FROM donor dn
        JOIN blood_compatibility bc
          ON bc.donor_group = dn.blood_group
         AND bc.recipient_group = v_rec.blood_group
        WHERE is_eligible_blood_donor(dn.donor_id) = 'Y'
          AND NOT EXISTS (SELECT 1 FROM donation_match m
                          WHERE m.request_id = p_request_id
                            AND m.donor_id = dn.donor_id)
        ORDER BY CASE WHEN dn.city = v_rec.city THEN 0 ELSE 1 END,
                 CASE WHEN dn.blood_group = v_rec.blood_group THEN 0 ELSE 1 END,
                 dn.last_donation_date NULLS FIRST
    ) LOOP
        EXIT WHEN v_count >= p_max_matches;

        INSERT INTO donation_match (request_id, donor_id)
        VALUES (p_request_id, d.donor_id);

        v_count := v_count + 1;
        DBMS_OUTPUT.PUT_LINE('Matched: ' || d.full_name || ' (' || d.blood_group
                             || ', ' || d.city || ')');
    END LOOP;

    IF v_count = 0 THEN
        DBMS_OUTPUT.PUT_LINE('No eligible donors found for request ' || p_request_id);
    END IF;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE_APPLICATION_ERROR(-20012, 'Request or recipient not found');
END match_blood_request;
/

-- ------------------------------------------------------------
-- PROCEDURE: match_organ_request
-- Finds available donors who pledged the requested organ and are
-- ABO compatible with the recipient.
-- ------------------------------------------------------------
CREATE OR REPLACE PROCEDURE match_organ_request (
    p_request_id  IN NUMBER,
    p_max_matches IN NUMBER DEFAULT 3
)
AS
    v_req   donation_request%ROWTYPE;
    v_rec   recipient%ROWTYPE;
    v_count NUMBER := 0;
BEGIN
    SELECT * INTO v_req FROM donation_request WHERE request_id = p_request_id;

    IF v_req.request_type <> 'ORGAN' THEN
        RAISE_APPLICATION_ERROR(-20013, 'Request ' || p_request_id || ' is not an organ request');
    END IF;
    IF v_req.status <> 'OPEN' THEN
        RAISE_APPLICATION_ERROR(-20011, 'Request ' || p_request_id || ' is not OPEN');
    END IF;

    SELECT * INTO v_rec FROM recipient WHERE recipient_id = v_req.recipient_id;

    FOR d IN (
        SELECT dn.donor_id, dn.full_name, dn.blood_group, dn.city
        FROM donor dn
        JOIN donor_organ dorg
          ON dorg.donor_id = dn.donor_id
         AND dorg.organ_id = v_req.organ_id
         AND dorg.status   = 'PLEDGED'
        JOIN blood_compatibility bc
          ON bc.donor_group = dn.blood_group
         AND bc.recipient_group = v_rec.blood_group
        WHERE dn.is_available = 'Y'
          AND NOT EXISTS (SELECT 1 FROM donation_match m
                          WHERE m.request_id = p_request_id
                            AND m.donor_id = dn.donor_id)
        ORDER BY CASE WHEN dn.city = v_rec.city THEN 0 ELSE 1 END,
                 CASE WHEN dn.blood_group = v_rec.blood_group THEN 0 ELSE 1 END
    ) LOOP
        EXIT WHEN v_count >= p_max_matches;

        INSERT INTO donation_match (request_id, donor_id)
        VALUES (p_request_id, d.donor_id);

        v_count := v_count + 1;
        DBMS_OUTPUT.PUT_LINE('Matched: ' || d.full_name || ' (' || d.blood_group
                             || ', ' || d.city || ')');
    END LOOP;

    IF v_count = 0 THEN
        DBMS_OUTPUT.PUT_LINE('No compatible organ donors found for request ' || p_request_id);
    END IF;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE_APPLICATION_ERROR(-20012, 'Request or recipient not found');
END match_organ_request;
/
