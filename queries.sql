-- ============================================================
-- queries.sql : views, report queries and a matching demo
-- Run AFTER sample_data.sql. Run section by section (Ctrl+Enter)
-- or all at once with F5.
-- ============================================================

-- ------------------------------------------------------------
-- VIEWS
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW v_eligible_donors AS
SELECT donor_id, full_name, blood_group, city, phone, last_donation_date
FROM donor
WHERE is_eligible_blood_donor(donor_id) = 'Y';

CREATE OR REPLACE VIEW v_open_requests AS
SELECT r.request_id,
       rec.full_name   AS recipient,
       rec.blood_group AS recipient_group,
       r.request_type,
       o.organ_name,
       r.units_needed,
       r.urgency,
       h.name          AS hospital,
       h.city          AS hospital_city,
       r.status,
       r.requested_on
FROM donation_request r
JOIN recipient rec ON rec.recipient_id = r.recipient_id
JOIN hospital h    ON h.hospital_id    = rec.hospital_id
LEFT JOIN organ_type o ON o.organ_id   = r.organ_id
WHERE r.status IN ('OPEN', 'MATCHED');

CREATE OR REPLACE VIEW v_match_summary AS
SELECT m.match_id,
       m.request_id,
       rec.full_name   AS recipient,
       rec.blood_group AS recipient_group,
       d.full_name     AS donor,
       d.blood_group   AS donor_group,
       d.city          AS donor_city,
       d.phone         AS donor_phone,
       m.status        AS match_status,
       m.matched_on
FROM donation_match m
JOIN donation_request r ON r.request_id   = m.request_id
JOIN recipient rec      ON rec.recipient_id = r.recipient_id
JOIN donor d            ON d.donor_id     = m.donor_id;

-- ------------------------------------------------------------
-- REPORT QUERIES
-- ------------------------------------------------------------

-- 1. Open requests, most urgent first
SELECT * FROM v_open_requests ORDER BY urgency DESC, requested_on;

-- 2. Donors per blood group, and how many are currently eligible
SELECT blood_group,
       COUNT(*) AS total_donors,
       SUM(CASE WHEN is_eligible_blood_donor(donor_id) = 'Y' THEN 1 ELSE 0 END) AS eligible_now
FROM donor
GROUP BY blood_group
ORDER BY blood_group;

-- 3. Every donor who could give blood to a given recipient
SELECT d.full_name, d.blood_group, d.city
FROM recipient rec
JOIN blood_compatibility bc ON bc.recipient_group = rec.blood_group
JOIN donor d                ON d.blood_group = bc.donor_group
WHERE rec.full_name = 'Ravi Teja';

-- 4. Pledged organs per city (cities with at least 1 pledge)
SELECT d.city, o.organ_name, COUNT(*) AS pledges
FROM donor_organ dorg
JOIN donor d      ON d.donor_id  = dorg.donor_id
JOIN organ_type o ON o.organ_id  = dorg.organ_id
WHERE dorg.status = 'PLEDGED'
GROUP BY d.city, o.organ_name
HAVING COUNT(*) >= 1
ORDER BY d.city, o.organ_name;

-- 5. Donors who have never donated or last donated over 90 days ago
SELECT full_name, blood_group, city, last_donation_date
FROM donor
WHERE last_donation_date IS NULL
   OR SYSDATE - last_donation_date >= 90
ORDER BY last_donation_date NULLS FIRST;

-- 6. Hospitals ranked by number of registered recipients
SELECT h.name, h.city, COUNT(rec.recipient_id) AS recipients
FROM hospital h
LEFT JOIN recipient rec ON rec.hospital_id = h.hospital_id
GROUP BY h.name, h.city
ORDER BY recipients DESC;

-- ------------------------------------------------------------
-- MATCHING DEMO
-- Step 1: look at the request ids (the matching calls below use 1, 4, 5)
-- ------------------------------------------------------------
SELECT request_id, recipient, request_type, organ_name, urgency, status
FROM v_open_requests
ORDER BY request_id;

-- Step 2: enable output, then run the matchers
SET SERVEROUTPUT ON

BEGIN
    match_blood_request(1);   -- Ravi Teja needs A+ blood
END;
/

BEGIN
    match_organ_request(4);   -- Fatima Begum needs a liver
END;
/

BEGIN
    match_organ_request(5);   -- Harish Babu needs a kidney
END;
/

-- Step 3: see the proposed matches
SELECT * FROM v_match_summary ORDER BY request_id, match_id;

-- Step 4: mark one match as completed (fires trg_match_status_sync)
UPDATE donation_match
SET status = 'COMPLETED'
WHERE match_id = (SELECT MIN(match_id) FROM donation_match WHERE request_id = 4);

SELECT request_id, recipient, status FROM v_open_requests ORDER BY request_id;

COMMIT;
