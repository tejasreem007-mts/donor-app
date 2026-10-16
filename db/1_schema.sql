create table hospital (
  hospital_id number generated always as identity primary key,
  name varchar2(100) not null,
  city varchar2(50) not null
);

create table donor (
  donor_id number generated always as identity primary key,
  full_name varchar2(100) not null,
  age number(3) check (age between 18 and 65),
  blood_group varchar2(3) check (blood_group in ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  city varchar2(50),
  phone varchar2(15),
  available char(1) default 'Y' check (available in ('Y','N'))
);

create table donor_organ (
  donor_id number references donor(donor_id),
  organ_name varchar2(30) not null,
  primary key (donor_id, organ_name)
);

create table recipient (
  recipient_id number generated always as identity primary key,
  full_name varchar2(100) not null,
  age number(3),
  blood_group varchar2(3) check (blood_group in ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  city varchar2(50),
  hospital_id number references hospital(hospital_id),
  need_type varchar2(10) check (need_type in ('blood','organ')),
  organ_needed varchar2(30),
  urgency number(1) check (urgency between 1 and 5),
  status varchar2(10) default 'waiting'
);

create table match_log (
  match_id number generated always as identity primary key,
  donor_id number references donor(donor_id),
  recipient_id number references recipient(recipient_id),
  matched_on date default sysdate
);
