import { motion } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import { Mail, Phone, Save, Stethoscope, User } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type DoctorUser = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
};

const DoctorProfilePage = () => {
  const [doctor, setDoctor] = useState<DoctorUser | null>(null);
  const [specialization, setSpecialization] = useState("General Physician");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const storedSpecialization = localStorage.getItem("mediclock_doctor_specialization");
    if (storedSpecialization) {
      setSpecialization(storedSpecialization);
    }

    const loadProfile = async () => {
      const current = await api.auth.me();
      if (current?._id) {
        setDoctor(current);
      }
    };

    loadProfile();
  }, []);

  const updateDoctorField = (field: keyof DoctorUser, value: string) => {
    setDoctor((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const saveProfile = async () => {
    if (!doctor?._id) {
      return;
    }

    setSaving(true);
    setStatus("");

    try {
      const response = await api.users.update(doctor._id, {
        name: doctor.name,
        email: doctor.email,
        phone: doctor.phone,
      });

      localStorage.setItem("mediclock_doctor_specialization", specialization);

      if (response?.user) {
        const merged = { ...doctor, ...response.user };
        setDoctor(merged);

        const storedRaw = localStorage.getItem("mediclock_user");
        if (storedRaw) {
          const parsed = JSON.parse(storedRaw);
          localStorage.setItem("mediclock_user", JSON.stringify({ ...parsed, ...merged }));
        }
      }

      setStatus("Profile saved successfully");
    } catch {
      setStatus("Unable to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
          <h2 className="font-display font-semibold text-lg mb-4">Doctor Profile</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Name</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={doctor?.name || ""}
                  onChange={(e) => updateDoctorField("name", e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Specialization</label>
              <div className="relative">
                <Stethoscope className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={doctor?.email || ""}
                  onChange={(e) => updateDoctorField("email", e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Contact Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={doctor?.phone || ""}
                  onChange={(e) => updateDoctorField("phone", e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>

          {status && <p className="text-sm text-muted-foreground mt-4">{status}</p>}

          <button
            onClick={saveProfile}
            disabled={saving}
            className="mt-5 px-4 py-2.5 rounded-xl gradient-blue text-primary-foreground text-sm font-medium inline-flex items-center gap-2 disabled:opacity-70"
          >
            <Save className="w-4 h-4" /> {saving ? "Saving..." : "Edit And Save Profile"}
          </button>
        </motion.div>
      </div>
    </PageTransition>
  );
};

export default DoctorProfilePage;
