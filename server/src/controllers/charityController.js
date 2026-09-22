import db from '../db/index.js';

export const charityController = {
  // Public directory with search and category filtering
  listCharities(req, res) {
    const { search, category, featured } = req.query;
    let charities = db.charities.find({ is_active: true });

    if (featured !== undefined) {
      const isFeatured = featured === 'true';
      charities = charities.filter((c) => c.is_featured === isFeatured);
    }

    if (category && category !== 'All') {
      charities = charities.filter((c) => c.category?.toLowerCase() === category.toLowerCase());
    }

    if (search) {
      const q = search.toLowerCase();
      charities = charities.filter(
        (c) => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
      );
    }

    // Attach total funds raised metric to each charity
    const charitiesWithStats = charities.map((c) => {
      const contributions = db.charityContributions.findByCharityId(c.id);
      const totalRaised = contributions.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
      return {
        ...c,
        totalRaised: parseFloat(totalRaised.toFixed(2)),
        supporterCount: new Set(contributions.map((item) => item.user_id)).size,
      };
    });

    res.json({ charities: charitiesWithStats });
  },

  // Public featured spotlight
  getFeaturedCharities(req, res) {
    const featured = db.charities.find({ is_active: true, is_featured: true });
    res.json({ charities: featured });
  },

  // Public charity detail page
  getCharityById(req, res) {
    const charity = db.charities.findById(req.params.id) || db.charities.findBySlug(req.params.id);
    if (!charity) {
      return res.status(404).json({ error: 'Charity organization not found.' });
    }

    const contributions = db.charityContributions.findByCharityId(charity.id);
    const totalRaised = contributions.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);

    res.json({
      charity: {
        ...charity,
        totalRaised: parseFloat(totalRaised.toFixed(2)),
        supporterCount: new Set(contributions.map((item) => item.user_id)).size,
      },
    });
  },

  // Authenticated user updates their selected charity and contribution percentage
  updateUserCharity(req, res) {
    try {
      const { charity_id, charity_percentage } = req.body;

      if (!charity_id && charity_percentage === undefined) {
        return res.status(400).json({ error: 'Charity ID or contribution percentage required.' });
      }

      const updates = {};

      if (charity_id) {
        const charity = db.charities.findById(charity_id);
        if (!charity) {
          return res.status(404).json({ error: 'Charity organization not found.' });
        }
        updates.selected_charity_id = charity_id;
      }

      if (charity_percentage !== undefined) {
        const percent = parseFloat(charity_percentage);
        if (isNaN(percent) || percent < 10.0 || percent > 100.0) {
          return res.status(400).json({
            error: 'Charity contribution percentage must be between 10% and 100%.',
          });
        }
        updates.charity_percentage = percent;
      }

      const updatedUser = db.users.update(req.user.id, updates);
      const selectedCharity = db.charities.findById(updatedUser.selected_charity_id);

      res.json({
        message: 'Charity preferences updated successfully.',
        selected_charity: selectedCharity,
        charity_percentage: updatedUser.charity_percentage,
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // Direct independent donation (PRD §08.1: "Independent donation option, not tied to gameplay")
  directDonate(req, res) {
    try {
      const charityId = req.params.id;
      const { amount, donor_name } = req.body;

      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        return res.status(400).json({ error: 'A valid donation amount is required.' });
      }

      const charity = db.charities.findById(charityId);
      if (!charity) {
        return res.status(404).json({ error: 'Charity organization not found.' });
      }

      const userId = req.user?.id || 'anonymous_donor';

      const contribution = db.charityContributions.create({
        user_id: userId,
        charity_id: charity.id,
        amount: numAmount,
        contribution_percentage: 100.0,
        contribution_type: 'DIRECT_DONATION',
      });

      res.status(201).json({
        message: `Thank you ${donor_name || 'Donor'}! Your donation of $${numAmount.toFixed(2)} was received.`,
        contribution,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Admin: Create charity
  adminCreate(req, res) {
    try {
      const { name, description, category, logo_url, cover_url, website_url, is_featured, upcoming_events } =
        req.body;

      if (!name || !description) {
        return res.status(400).json({ error: 'Charity name and description are required.' });
      }

      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      const charity = db.charities.create({
        name,
        slug: `${slug}-${Date.now().toString(36)}`,
        description,
        category: category || 'Community Impact',
        logo_url: logo_url || '',
        cover_url: cover_url || '',
        website_url: website_url || '',
        is_active: true,
        is_featured: !!is_featured,
        upcoming_events: Array.isArray(upcoming_events) ? upcoming_events : [],
      });

      res.status(201).json({ message: 'Charity created successfully.', charity });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // Admin: Update charity
  adminUpdate(req, res) {
    const updated = db.charities.update(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Charity not found.' });
    }
    res.json({ message: 'Charity updated successfully.', charity: updated });
  },

  // Admin: Delete charity
  adminDelete(req, res) {
    const deleted = db.charities.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Charity not found.' });
    }
    res.json({ message: 'Charity removed successfully.' });
  },
};
