import { DataTypes, Sequelize } from 'sequelize';

export default (sequelize: Sequelize) => {
  return sequelize.define(
    'mehfil_reports',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      report_month: { type: DataTypes.INTEGER, allowNull: false },
      report_year: { type: DataTypes.INTEGER, allowNull: false },
      zone_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      mehfil_directory_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      ehad_karkun_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      coordinator_name: { type: DataTypes.STRING(255), allowNull: false },
      coordinator_monthly_attendance_days: { type: DataTypes.INTEGER, allowNull: false },
      total_duty_karkuns: { type: DataTypes.INTEGER, allowNull: false },
      attendance_below_50_percent_karkuns: { type: DataTypes.INTEGER, allowNull: false },
      consistently_absent_karkuns: { type: DataTypes.INTEGER, allowNull: false },
      ehad_karkuns_monthly_attendance_days: { type: DataTypes.INTEGER, allowNull: false },
      new_ehads_in_month: { type: DataTypes.INTEGER, allowNull: false },
      mehfil_days_in_month: { type: DataTypes.INTEGER, allowNull: true },
      multan_duty_karkuns: { type: DataTypes.INTEGER, allowNull: false },
      taleemat_e_karima_read: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 0 },
      sawari_and_bhangra_held: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 0 },
      daily_karkuns_attendance: { type: DataTypes.INTEGER, allowNull: false },
      monthly_main_mehfil_karkuns_attendance: { type: DataTypes.INTEGER, allowNull: false },
      naam_mubarak_meeting_karkuns_attendance: { type: DataTypes.INTEGER, allowNull: false },
      all_karkuns_meeting_attendance: { type: DataTypes.INTEGER, allowNull: false },
      mashwara_meeting_date: { type: DataTypes.DATEONLY, allowNull: true },
      mashwara_meeting_participant_karkuns: { type: DataTypes.INTEGER, allowNull: true },
      monthly_meeting_agenda_details: { type: DataTypes.TEXT, allowNull: true },
      created_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      updated_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: true },
      updated_at: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: 'mehfil_reports', timestamps: false, underscored: true },
  );
};
