import ServiceType from "../models/serviceType.model.js";

// Helper function to handle service name uniqueness check
const checkExistingService = async (serviceName, excludeId = null) => {
    const query = { serviceName: serviceName, isDeleted: false };
    if (excludeId) {
        query._id = { $ne: excludeId };
    }
    return await ServiceType.findOne(query);
};

// --- CREATE Service Type ---
export const createServiceType = async (req, res) => {
    try {
        // Use 'serviceName' to match the schema field name
        const { serviceName, description, icon, servicePriorities } = req.body;

        if (!serviceName) {
            return res.status(400).json({ message: "Service name is required" });
        }

        // Check if a service with the same name already exists
        const existingService = await checkExistingService(serviceName);
        if (existingService) {
            return res.status(400).json({ message: "Service type already exists" });
        }

        const serviceType = await ServiceType.create({
            serviceName, // Changed 'name' to 'serviceName' to match model
            description,
            icon,
            // Pass the array of priorities/pricing directly
            servicePriorities: servicePriorities || [], 
        });

        res.status(201).json({
            message: "Service type created successfully",
            data: serviceType,
        });
    } catch (err) {
        console.error("Create service type error:", err);
        res.status(500).json({ message: "Server Error" });
    }
};

// --- GET All Service Types ---
export const getServiceTypes = async (req, res) => {
    try {
        // Retrieve only non-deleted and active services for public/general access
        const serviceTypes = await ServiceType.find({
            isDeleted: false,
            isActive: true,
        }).sort({ createdAt: -1 });

        res.status(200).json({
            message: "Service types retrieved successfully",
            data: serviceTypes,
        });
    } catch (err) {
        console.error("Get service types error:", err);
        res.status(500).json({ message: "Server Error" });
    }
};

// --- UPDATE Service Type (Admin Only) ---
export const updateServiceType = async (req, res) => {
    try {
        const { id } = req.params;
        const { serviceName, description, icon, isActive, servicePriorities } = req.body;

        if (!serviceName) {
            return res.status(400).json({ message: "Service name is required for update" });
        }
        
        // 1. Check for duplicate name, excluding the current service ID
        const existingService = await checkExistingService(serviceName, id);
        if (existingService) {
            return res.status(400).json({ message: "Service type name already in use" });
        }

        // 2. Prepare the fields to update
        const updateFields = { serviceName, description, icon, isActive, servicePriorities };
        
        const updatedServiceType = await ServiceType.findByIdAndUpdate(
            id,
            { $set: updateFields },
            { new: true, runValidators: true } // Return the updated document and run schema validation
        );

        if (!updatedServiceType) {
            return res.status(404).json({ message: "Service type not found" });
        }

        res.status(200).json({
            message: "Service type updated successfully",
            data: updatedServiceType,
        });
    } catch (err) {
        console.error("Update service type error:", err);
        res.status(500).json({ message: "Server Error" });
    }
};

// --- DELETE Service Type (Admin Only - Soft Delete) ---
export const deleteServiceType = async (req, res) => {
    try {
        const { id } = req.params;

        // Perform a soft delete by setting isDeleted to true
        const deletedServiceType = await ServiceType.findByIdAndUpdate(
            id,
            { $set: { isDeleted: true, isActive: false } }, // Also set isActive to false
            { new: true }
        );

        if (!deletedServiceType) {
            return res.status(404).json({ message: "Service type not found" });
        }

        res.status(200).json({
            message: "Service type deleted successfully (soft delete)",
        });
    } catch (err) {
        console.error("Delete service type error:", err);
        res.status(500).json({ message: "Server Error" });
    }
};