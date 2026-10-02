import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { uid } from '../data';
import { useApp } from '../App';
import DoctorShell from '../components/DoctorShell';
import { doctorAppointments, doctorPatients, doctorProfile } from './data';

let sessionPatients = doctorPatients;
const patientListeners = new Set();
let sessionAppointments = doctorAppointments;
const appointmentListeners = new Set();

function subscribePatients(listener) {
  patientListeners.add(listener);
  return () => patientListeners.delete(listener);
}

function getPatients() {
  return sessionPatients;
}

function replacePatients(next) {
  sessionPatients = next;
  patientListeners.forEach((listener) => listener());
}

function subscribeAppointments(listener) {
  appointmentListeners.add(listener);
  return () => appointmentListeners.delete(listener);
}

function getAppointments() {
  return sessionAppointments;
}

function replaceAppointments(next) {
  sessionAppointments = next;
  appointmentListeners.forEach((listener) => listener());
}

const DoctorContext = createContext(null);

export function useDoctor() {
  return useContext(DoctorContext);
}

const titles = {
  '/doctor': 'Dashboard',
  '/doctor/patients': 'Patients',
  '/doctor/appointments': 'Appointments',
};

export default function DoctorLayout() {
  const { notify } = useApp();
  const { pathname } = useLocation();
  const patients = useSyncExternalStore(subscribePatients, getPatients, getPatients);
  const appointments = useSyncExternalStore(subscribeAppointments, getAppointments, getAppointments);

  useEffect(() => {
    document.title = `${titles[pathname] || 'Doctor'} · HealthPassport`;
  }, [pathname]);

  const addPatient = useCallback((form) => {
    const saved = {
      id: uid('dp'),
      name: form.name.trim(),
      age: Number(form.age),
      status: form.status,
      lastVisit: '—',
      problems: [{ name: form.problem.trim(), status: form.problemStatus }],
    };
    replacePatients([saved, ...sessionPatients]);
    return saved;
  }, []);

  const addAppointment = (form) => {
    const patient = getPatients().find((item) => item.id === form.patientId);
    const saved = {
      id: uid('da'),
      patientId: patient.id,
      patientName: patient.name,
      title: form.title.trim(),
      startsAt: new Date(`${form.date}T${form.startTime}`).toISOString(),
      endsAt: new Date(`${form.date}T${form.endTime}`).toISOString(),
      location: form.location.trim(),
      description: form.description.trim(),
      status: 'Upcoming',
    };
    replaceAppointments(
      [...sessionAppointments, saved].sort((left, right) => new Date(left.startsAt) - new Date(right.startsAt)),
    );
    return saved;
  };

  const setAppointmentStatus = (id, status) => {
    replaceAppointments(sessionAppointments.map((item) => (item.id === id ? { ...item, status } : item)));
  };

  const value = useMemo(() => ({
    profile: doctorProfile,
    patients,
    appointments,
    notify,
    addPatient,
    addAppointment,
    setAppointmentStatus,
  }), [patients, appointments, notify, addPatient]);

  return (
    <DoctorContext.Provider value={value}>
      <DoctorShell>
        <Outlet />
      </DoctorShell>
    </DoctorContext.Provider>
  );
}
