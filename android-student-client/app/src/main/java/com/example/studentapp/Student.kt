package com.example.studentapp

import com.google.gson.annotations.SerializedName

data class Student(
    @SerializedName("id") val id: String? = null,
    @SerializedName("name") val name: String,
    @SerializedName("email") val email: String,
    @SerializedName("course") val course: String,
    @SerializedName("semester") val semester: Int
)

data class StudentInput(
    @SerializedName("name") val name: String,
    @SerializedName("email") val email: String,
    @SerializedName("course") val course: String,
    @SerializedName("semester") val semester: Int
)

data class ApiErrorResponse(
    @SerializedName("message") val message: String? = null
)
