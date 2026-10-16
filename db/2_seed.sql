insert into hospital (name, city) values ('City General Hospital', 'Kurnool');
insert into hospital (name, city) values ('Apollo Hospital', 'Vellore');

insert into donor (full_name, age, blood_group, city, phone) values ('Ravi Kumar', 30, 'O-', 'Kurnool', '9000000001');
insert into donor (full_name, age, blood_group, city, phone) values ('Anita Rao', 28, 'A+', 'Vellore', '9000000002');
insert into donor (full_name, age, blood_group, city, phone) values ('Sameer Khan', 35, 'B+', 'Kurnool', '9000000003');

insert into donor_organ values (1, 'kidney');
insert into donor_organ values (2, 'kidney');
insert into donor_organ values (3, 'liver');

insert into recipient (full_name, age, blood_group, city, hospital_id, need_type, organ_needed, urgency) values ('Meena Devi', 45, 'A+', 'Kurnool', 1, 'organ', 'kidney', 5);
insert into recipient (full_name, age, blood_group, city, hospital_id, need_type, urgency) values ('Arjun Reddy', 22, 'B+', 'Vellore', 2, 'blood', 3);

commit;
