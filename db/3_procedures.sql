create or replace function is_compatible(p_donor varchar2, p_recip varchar2) return number is
  d_abo varchar2(2);
  r_abo varchar2(2);
  d_rh char(1);
  r_rh char(1);
begin
  d_abo := substr(p_donor, 1, length(p_donor) - 1);
  d_rh := substr(p_donor, -1);
  r_abo := substr(p_recip, 1, length(p_recip) - 1);
  r_rh := substr(p_recip, -1);
  if d_rh = '+' and r_rh = '-' then return 0; end if;
  if d_abo = 'O' then return 1; end if;
  if d_abo = r_abo then return 1; end if;
  if r_abo = 'AB' then return 1; end if;
  return 0;
end;
/

create or replace procedure find_matches(p_recipient_id in number, p_result out sys_refcursor) is
  r_group recipient.blood_group%type;
  r_type recipient.need_type%type;
  r_organ recipient.organ_needed%type;
begin
  select blood_group, need_type, organ_needed into r_group, r_type, r_organ
  from recipient where recipient_id = p_recipient_id;

  if r_type = 'blood' then
    open p_result for
      select d.donor_id, d.full_name, d.blood_group, d.city, d.phone
      from donor d
      where d.available = 'Y' and is_compatible(d.blood_group, r_group) = 1;
  else
    open p_result for
      select d.donor_id, d.full_name, d.blood_group, d.city, d.phone
      from donor d join donor_organ o on o.donor_id = d.donor_id
      where d.available = 'Y' and o.organ_name = r_organ
        and is_compatible(d.blood_group, r_group) = 1;
  end if;
end;
/

create or replace trigger trg_match_after_insert
after insert on match_log
for each row
begin
  update donor set available = 'N' where donor_id = :new.donor_id;
  update recipient set status = 'matched' where recipient_id = :new.recipient_id;
end;
/

create or replace procedure confirm_match(p_donor_id in number, p_recipient_id in number) is
begin
  insert into match_log (donor_id, recipient_id) values (p_donor_id, p_recipient_id);
  commit;
end;
/
