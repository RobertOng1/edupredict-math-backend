import Class from "../models/Class.js";
import createNotification from "../utils/createNotification.js";

const generateClassCode = () => {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

  let code = "";

  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return code;
};

export const createClass = async (req, res) => {
  try {
    const { className } = req.body;

    if (!className) {
      return res.status(400).json({
        message: "Nama kelas wajib diisi",
      });
    }

    let classCode;
    let isExist = true;

    while (isExist) {
      classCode = generateClassCode();

      const existingClass = await Class.findOne({
        classCode,
      });

      isExist = !!existingClass;
    }

    const newClass = await Class.create({
      className,
      classCode,
      teacher: req.user._id,
      students: [],
    });

    await createNotification({
      userId: req.user._id,
      title: "Kelas berhasil dibuat",
      message: `Kelas ${newClass.className} berhasil dibuat dengan kode ${newClass.classCode}.`,
      type: "class",
    });

    res.status(201).json({
      success: true,
      message: "Kelas berhasil dibuat",
      class: newClass,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getTeacherClasses = async (req, res) => {
  try {
    const classes = await Class.find({
      teacher: req.user._id,
    }).populate("students", "fullName email photoUrl");

    res.json({
      success: true,
      classes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getClassDetail = async (req, res) => {
  try {
    const { classId } = req.params;

    const classData = await Class.findById(classId).populate(
      "students",
      "fullName email photoUrl xp streak level"
    );

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: "Kelas tidak ditemukan",
      });
    }

    if (classData.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Anda tidak memiliki akses ke kelas ini",
      });
    }

    res.json({
      success: true,
      class: classData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const joinClass = async (req, res) => {
  try {
    const { classCode } = req.body;

    if (!classCode) {
      return res.status(400).json({
        success: false,
        message: "Class code wajib diisi",
      });
    }

    const classData = await Class.findOne({
      classCode: classCode.toUpperCase(),
    });

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: "Class code tidak ditemukan",
      });
    }

    const alreadyJoined = classData.students.some(
      (studentId) => studentId.toString() === req.user._id.toString()
    );

    if (alreadyJoined) {
      return res.status(400).json({
        success: false,
        message: "Kamu sudah bergabung di kelas ini",
      });
    }

    classData.students.push(req.user._id);
    await classData.save();

    await createNotification({
      userId: req.user._id,
      title: "Berhasil join kelas",
      message: `Kamu berhasil bergabung ke kelas ${classData.className}.`,
      type: "class",
    });

    await createNotification({
      userId: classData.teacher,
      title: "Siswa baru bergabung",
      message: `${req.user.fullName} baru saja bergabung ke kelas ${classData.className}.`,
      type: "class",
    });

    res.json({
      success: true,
      message: "Berhasil bergabung ke kelas",
      class: {
        id: classData._id,
        className: classData.className,
        classCode: classData.classCode,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMyClasses = async (req, res) => {
  try {
    const classes = await Class.find({
      students: req.user._id,
    }).populate("teacher", "fullName email");

    res.json({
      success: true,
      classes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const leaveClass = async (req, res) => {
  try {
    const { classId } = req.params;

    const classData = await Class.findById(classId);

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: "Kelas tidak ditemukan",
      });
    }

    const isStudentInClass = classData.students.some(
      (studentId) => studentId.toString() === req.user._id.toString()
    );

    if (!isStudentInClass) {
      return res.status(400).json({
        success: false,
        message: "Kamu tidak tergabung di kelas ini",
      });
    }

    classData.students = classData.students.filter(
      (studentId) => studentId.toString() !== req.user._id.toString()
    );

    await classData.save();

    await createNotification({
      userId: req.user._id,
      title: "Keluar dari kelas",
      message: `Kamu telah keluar dari kelas ${classData.className}.`,
      type: "class",
    });

    await createNotification({
      userId: classData.teacher,
      title: "Siswa keluar dari kelas",
      message: `${req.user.fullName} keluar dari kelas ${classData.className}.`,
      type: "class",
    });

    res.json({
      success: true,
      message: "Berhasil keluar dari kelas",
      class: {
        id: classData._id,
        className: classData.className,
        classCode: classData.classCode,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteClass = async (req, res) => {
  try {
    const { classId } = req.params;

    const classData = await Class.findById(classId);

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: "Kelas tidak ditemukan",
      });
    }

    if (classData.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Anda tidak memiliki akses untuk menghapus kelas ini",
      });
    }

    await Class.findByIdAndDelete(classId);

    res.json({
      success: true,
      message: "Kelas berhasil dihapus",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const removeStudentFromClass = async (req, res) => {
  try {
    const { classId, studentId } = req.params;

    const classData = await Class.findById(classId);

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: "Kelas tidak ditemukan",
      });
    }

    if (classData.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Anda tidak memiliki akses ke kelas ini",
      });
    }

    const isStudentInClass = classData.students.some(
      (id) => id.toString() === studentId.toString()
    );

    if (!isStudentInClass) {
      return res.status(404).json({
        success: false,
        message: "Siswa tidak ditemukan di kelas ini",
      });
    }

    classData.students = classData.students.filter(
      (id) => id.toString() !== studentId.toString()
    );

    await classData.save();

    await createNotification({
      userId: studentId,
      title: "Dikeluarkan dari kelas",
      message: `Kamu telah dikeluarkan dari kelas ${classData.className}.`,
      type: "class",
    });

    res.json({
      success: true,
      message: "Siswa berhasil dihapus dari kelas",
      class: classData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};