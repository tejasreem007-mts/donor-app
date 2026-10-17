-- ============================================================
-- triggers.sql : business rules enforced inside the database
-- Run AFTER tables.sql, BEFORE sample_data.sql
-- ============================================================

-- 1. Donors must be adults (18+)
CREATE OR REPLACE TRIGGER trg_donor_age_check
BEFORE INSERT OR UPDATE OF dob ON donor
FOR EACH ROW
BEGIN
    IF MONTHS_BETWEEN(SYSDATE, :NEW.dob) / 12 < 18 THEN
        RAISE_APPLICATION_ERROR(-20001, 'Donor must be at least 18 years old');
    END IF;
END;
/

-- 2. Blood donation rule: at least 90 days between donations.
--    Also keeps donor.last_donation_date up to date automatically.
CREATE OR REPLACE TRIGGER trg_blood_donation_rules
BEFORE INSERT ON blood_donation
FOR EACH ROW
DECLARE
    v_last DATE;
BEGIN
    SELECT last_donation_date INTO v_last
    FROM donor
    WHERE donor_id = :NEW.donor_id;

    IF v_last IS NOT NULL AND (:NEW.donation_date - v_last) < 90 THEN
        RAISE_APPLICATION_ERROR(-20002,
            'Donor donated less than 90 days ago (last donation: '
            || TO_CHAR(v_last, 'DD-MON-YYYY') || ')');
    END IF;

    UPDATE donor
    SET last_donation_date = GREATEST(NVL(last_donation_date, :NEW.donation_date),
                                      :NEW.donation_date)
    WHERE donor_id = :NEW.donor_id;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        NULL;  -- foreign key will report the missing donor
END;
/

-- 3. Keep request status in sync with matches
--    New match      -> request becomes MATCHED
--    Match COMPLETED -> request FULFILLED, pledged organ marked DONATED
CREATE OR REPLACE TRIGGER trg_match_status_sync
AFTER INSERT OR UPDATE OF status ON donation_match
FOR EACH ROW
BEGIN
    IF INSERTING THEN
        UPDATE donation_request
        SET status = 'MATCHED'
        WHERE request_id = :NEW.request_id
          AND status = 'OPEN';
    ELSIF UPDATING AND :NEW.status = 'COMPLETED' AND :OLD.status <> 'COMPLETED' THEN
        UPDATE donation_request
        SET status = 'FULFILLED'
        WHERE request_id = :NEW.request_id;

        UPDATE donor_organ
        SET status = 'DONATED'
        WHERE donor_id = :NEW.donor_id
          AND organ_id = (SELECT organ_id
                          FROM donation_request
                          WHERE request_id = :NEW.request_id);
    END IF;
END;
/
