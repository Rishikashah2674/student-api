package com.example.studentapp

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView

class StudentAdapter(private var studentList: List<Student>) :
    RecyclerView.Adapter<StudentAdapter.StudentViewHolder>() {

    class StudentViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val tvName: TextView = itemView.findViewById(R.id.tvName)
        val tvEmail: TextView = itemView.findViewById(R.id.tvEmail)
        val tvCourse: TextView = itemView.findViewById(R.id.tvCourse)
        val tvSemester: TextView = itemView.findViewById(R.id.tvSemester)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): StudentViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_student, parent, false)
        return StudentViewHolder(view)
    }

    override fun onBindViewHolder(holder: StudentViewHolder, position: Int) {
        val student = studentList[position]
        holder.tvName.text = student.name
        holder.tvEmail.text = student.email
        holder.tvCourse.text = student.course
        holder.tvSemester.text = "Semester ${student.semester}"
    }

    override fun getItemCount(): Int = studentList.size

    fun updateData(newList: List<Student>) {
        studentList = newList
        notifyDataSetChanged()
    }
}
